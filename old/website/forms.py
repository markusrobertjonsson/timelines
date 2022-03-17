from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, PasswordField, SubmitField, BooleanField, SelectField
from wtforms.validators import DataRequired, Length, Email  # , EqualTo

from .models import LABEL_MAXLENGTH, DESCRIPTION_MAXLENGTH  # , DATA_MAXLENGTH


class AddDataSetForm(FlaskForm):
    label = StringField("Label (displayed in list of datasets):", default="",
                        validators=[DataRequired(), Length(min=3, max=LABEL_MAXLENGTH)])
    description = TextAreaField("Description:",
                                validators=[Length(max=DESCRIPTION_MAXLENGTH)])
    # time_values = TextAreaField("Time values:",
    #                             validators=[DataRequired(), Length(max=DATA_MAXLENGTH)])
    # data_values = TextAreaField("Data values:",
    #                             validators=[DataRequired(), Length(max=DATA_MAXLENGTH)])
    data_is_qualitative = BooleanField("Data is qualitative:", default=False)
    data_unit_choices = [("None", "None"),
                         ("kg", 'kg'), ("tonnes", "tonnes"),
                         ("m", 'm'),
                         ("m2", 'm2'),
                         ("m3", 'm3'), ("km3", "km3"),
                         ("number of", "number of"),
                         ("percentage", "percentage"), ("ppm", "ppm"), ("ppb", "ppb"),
                         ("degrees Celsius", "degrees Celsius"),
                         ("USD", "USD"),
                         ("Joule", "Joule"), ("Exajoule", "Exajoule")]
    data_unit = SelectField("Unit for data values:",
                            choices=data_unit_choices,
                            validators=[DataRequired()])
    legend = StringField("String for legend in graph:",
                         validators=[DataRequired(), Length(min=3, max=LABEL_MAXLENGTH)])

# XXX Use this (in auth.py and sign-up.html)
# class RegistrationForm(FlaskForm):
#     email = StringField('Email', validators=[DataRequired(), Email()])
#     name = StringField('Email', validators=[DataRequired()])
#     password = PasswordField('Password', validators=[DataRequired()])
#     confirm_password = PasswordField('Confirm password',
#                                      validators=[DataRequired(),
#                                                  EqualTo('password', message='Passwords must match.')])
#     submit = SubmitField('Sign up')


class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember me')
    submit = SubmitField('Login')
