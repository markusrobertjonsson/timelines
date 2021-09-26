from . import db  # From current package ("website") import db
from flask_login import UserMixin
from sqlalchemy.sql import func

LABEL_MAXLENGTH = 50
UNIT_MAXLENGTH = 20
DESCRIPTION_MAXLENGTH = 1000
DATA_MAXLENGTH = 10000

class DataSet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    id_predef = db.Column(db.Integer, unique=True, nullable=True)  # Unique if not null
    label = db.Column(db.String(LABEL_MAXLENGTH))   # For checkbox lists
    description = db.Column(db.String(DESCRIPTION_MAXLENGTH))
    time_values = db.Column(db.String(DATA_MAXLENGTH))
    data_values = db.Column(db.String(DATA_MAXLENGTH))
    data_is_qualitative = db.Column(db.Boolean, unique=False, default=False)
    data_scale = db.Column(db.Integer, nullable=True)  # Power of ten
    data_unit = db.Column(db.String(UNIT_MAXLENGTH))
    legend = db.Column(db.String(LABEL_MAXLENGTH))
    date = db.Column(db.DateTime(timezone=True), default=func.now())
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # null means predefined data


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True)
    password = db.Column(db.String(150))
    name = db.Column(db.String(150))
    datasets = db.relationship('DataSet')
