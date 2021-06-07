from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, PasswordField, SubmitField, BooleanField
from wtforms.validators import DataRequired, Length, Email, EqualTo

from .models import LABEL_MAXLENGTH, DESCRIPTION_MAXLENGTH, DATA_MAXLENGTH


class AddDataSetForm(FlaskForm):
    label = StringField("Label",
                        validators=[DataRequired(), Length(min=3, max=LABEL_MAXLENGTH)])
    description = TextAreaField("Description",
                                validators=[Length(max=DESCRIPTION_MAXLENGTH)])
    time_values = TextAreaField("Time values",
                                validators=[DataRequired(), Length(max=DATA_MAXLENGTH)])
    data_values = TextAreaField("Data values",
                                validators=[DataRequired(), Length(max=DATA_MAXLENGTH)])


class RegistrationForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    confirm_password = PasswordField('Confirm password', 
                                     validators=[DataRequired(),
                                                 EqualTo('password', message='Passwords must match.')])
    submit = SubmitField('Sign up')


class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember me')
    submit = SubmitField('Login')
