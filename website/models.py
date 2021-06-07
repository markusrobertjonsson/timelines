from . import db  # From current package ("website") import db
from flask_login import UserMixin
from sqlalchemy.sql import func

LABEL_MAXLENGTH = 50
DESCRIPTION_MAXLENGTH = 1000
DATA_MAXLENGTH = 10000

class DataSet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(LABEL_MAXLENGTH), unique=True)
    description = db.Column(db.String(DESCRIPTION_MAXLENGTH))
    time_values = db.Column(db.String(DATA_MAXLENGTH))
    data_values = db.Column(db.String(DATA_MAXLENGTH))
    date = db.Column(db.DateTime(timezone=True), default=func.now())
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True)
    password = db.Column(db.String(150))
    first_name = db.Column(db.String(150))
    datasets = db.relationship('DataSet')
