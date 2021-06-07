import os
from flask import Flask, render_template, request, redirect
from dotenv import load_dotenv
from flask_wtf import FlaskForm
from wtforms import validators, fields
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

load_dotenv()  # Read info from .env

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI')

# To avoid warning. We do not use the Flask-SQLAlchemy event system, anyway.
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)

# app.debug = True

db = SQLAlchemy(app)


class DataSet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(30), nullable=False, unique=True)


class DataSetForm(FlaskForm):
    name = fields.StringField(
        label="Name",
        validators=[
            validators.DataRequired(),
            validators.Length(min=3, max=30)
        ]
    )

db.create_all()


@app.route('/')
def index():
    return "Hello, worlds!"

## List all datasets
@app.route('/datasets/')
def datasets_index():
    datasets = DataSet.query.all()
    return render_template("datasets/index.html", datasets=datasets)

# Add dataset
@app.route('/datasets/create', methods=['GET', 'POST'])
def datasets_create():
    form = DataSetForm()
    if form.validate_on_submit():
        # Checks the csrf token
        # Executes on POST
        # Validates all data (so we can "trust" it)
        dataset = DataSet(name=form.name.data)
        db.session.add(dataset)  # Queue up the insert
        db.session.commit() # Execute the transaction
        return redirect('/datasets')
    else:
        # Return the form
        return render_template('datasets/create.html', form=form)

# Details
@app.route('/datasets/<int:id>')
def datasets_details(id):
    dataset = DataSet.query.get_or_404(id)
    print(id)
    return render_template('datasets/details.html', dataset=dataset)
