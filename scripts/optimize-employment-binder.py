from __future__ import annotations

import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, DictionaryObject, IndirectObject, NameObject


def resolved(value):
    return value.get_object() if isinstance(value, IndirectObject) else value


def is_javascript_action(value) -> bool:
    value = resolved(value)
    return isinstance(value, DictionaryObject) and str(value.get('/S', '')) == '/JavaScript'


def remove_javascript(value, seen: set[object]) -> int:
    reference = value if isinstance(value, IndirectObject) else None
    if reference:
        identity = (reference.idnum, reference.generation)
        if identity in seen:
            return 0
        seen.add(identity)
    value = resolved(value)
    if isinstance(value, (DictionaryObject, ArrayObject)):
        direct_identity = ('direct', id(value))
        if direct_identity in seen:
            return 0
        seen.add(direct_identity)
    removed = 0
    if isinstance(value, DictionaryObject):
        action = value.get('/A')
        if action is not None and is_javascript_action(action):
            del value[NameObject('/A')]
            removed += 1
        additional = resolved(value.get('/AA')) if value.get('/AA') is not None else None
        if isinstance(additional, DictionaryObject):
            for key in list(additional.keys()):
                if is_javascript_action(additional[key]):
                    del additional[key]
                    removed += 1
            if not additional:
                del value[NameObject('/AA')]
        for key in list(value.keys()):
            removed += remove_javascript(value[key], seen)
    elif isinstance(value, ArrayObject):
        for item in value:
            removed += remove_javascript(item, seen)
    return removed


def optimize(source: Path, destination: Path) -> None:
    reader = PdfReader(source)
    if reader.is_encrypted and reader.decrypt('') == 0:
        raise RuntimeError('The binder requires an owner password before it can be optimized.')

    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    removed_actions = remove_javascript(writer._root_object, set())
    writer._root_object.pop(NameObject('/Outlines'), None)
    writer._root_object[NameObject('/PageMode')] = NameObject('/UseOutlines')

    bookmarks = [
        ('Section 1 - Initial employment documents', 0),
        ('Application for Employment', 1),
        ('Emergency Medical Information', 5),
        ('Job Offer', 6),
        ('Handbook Acknowledgement', 7),
        ('Section 2 - Background checks and screenings', 8),
        ('Affidavit of Good Moral Character', 9),
        ('Reference and Background Check Consent', 11),
        ('Drug and Alcohol Testing Consent', 12),
        ('Reference Verification Forms', 13),
        ('Section 3 - Education verification', 16),
        ('Section 4 - Employment agreements', 17),
        ('Employment Agreement', 18),
        ('ADA Compliance', 19),
        ('Confidentiality Agreement', 20),
        ('Child Abuse and Neglect Acknowledgement', 21),
        ('Payment Schedule Agreement', 22),
        ('Direct Deposit Authorization', 23),
        ('Section 5 - Performance', 24),
        ('Section 6 - Personal documents', 25),
    ]
    for title, page_number in bookmarks:
        writer.add_outline_item(title, page_number)

    writer.add_metadata({
        '/Title': 'Employment Application Binder',
        '/Author': 'Eastern Medical Group, Corp.',
        '/Subject': 'Human Resources blank employee package',
        '/Keywords': 'employment application, employee package, human resources',
        '/Creator': 'Operational Hub',
        '/Producer': 'Operational Hub PDF optimization workflow',
    })
    for page in writer.pages:
        page.compress_content_streams()
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open('wb') as output:
        writer.write(output)
    print(f'Wrote {destination} with {len(writer.pages)} pages; removed {removed_actions} JavaScript actions.')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Usage: optimize-employment-binder.py INPUT.pdf OUTPUT.pdf')
    optimize(Path(sys.argv[1]), Path(sys.argv[2]))
