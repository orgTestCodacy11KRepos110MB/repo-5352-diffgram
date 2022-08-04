import datetime

from sqlalchemy.orm.session import Session
from shared.database.attribute.attribute_template_group import Attribute_Template_Group
from shared.shared_logger import get_shared_logger
import time
from sqlalchemy import Column
from shared.database.project import Project
from time import mktime

logger = get_shared_logger()


def get_file_annotations_column_from_attribute_kind(attr_kind: str) -> Column or None:
    from shared.database.source_control.file_annotations import FileAnnotations
    value = None
    if attr_kind == 'tree':
        val = FileAnnotations.attribute_template_id

    elif attr_kind == 'date':
        val = FileAnnotations.attribute_value_selected_date
    elif attr_kind == 'time':
        val = FileAnnotations.attribute_value_selected_time
    elif attr_kind == 'slider':
        val = FileAnnotations.attribute_value_number
    elif attr_kind == 'radio':
        val = FileAnnotations.attribute_template_id
    elif attr_kind == 'multiple_select':
        val = FileAnnotations.attribute_template_id
    elif attr_kind == 'text':
        val = FileAnnotations.attribute_value_text
    elif attr_kind == 'select':
        val = FileAnnotations.attribute_template_id
    else:
        logger.error(f'Invalid attribute kind {attr_kind}')
        return None
    return value


def get_attribute_value(session: Session, attr_id: int, attribute_value: any, project: Project) -> [any, str]:
    attribute_group = Attribute_Template_Group.get_by_id(
        session = session,
        id = attr_id,
        project_id = project.id
    )
    value = None
    if attribute_group is None:
        logger.error(f'Attribute Group does not exists: {attr_id}')
        return None, None

    if attribute_group.kind == 'tree':
        # For tree attributes we will return a list with the ID of all the selected attribute templates.
        selected_dict = attribute_value
        value = []
        for key, val in selected_dict.items():
            if selected_dict[key].get('selected'):
                value.append(key)

    elif attribute_group.kind == 'date':
        # For date attributes we return a date time.
        value = datetime.datetime.strptime(attribute_value, "%Y-%m-%d")
    elif attribute_group.kind == 'time':
        # For time attributes we return a time object.
        value = time.strptime(attribute_value, "%H:%M")
        value = datetime.datetime.fromtimestamp(mktime(value))
    elif attribute_group.kind == 'slider':
        value = int(attribute_value)
    elif attribute_group.kind == 'radio':
        value = int(attribute_value['id'])
    elif attribute_group.kind == 'multiple_select':
        value = []
        for option in attribute_value:
            value.append(option['id'])
    elif attribute_group.kind == 'text':
        value = str(attribute_value)
    elif attribute_group.kind == 'select':
        value = int(attribute_value['id'])
    return value, attribute_group.kind
