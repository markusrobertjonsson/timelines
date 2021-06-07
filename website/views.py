from flask import Blueprint, render_template, request, flash, jsonify, redirect, url_for
from flask_login import login_required, current_user
from .models import DataSet
from .forms import AddDataSetForm
from . import db
import json

views = Blueprint('views', __name__)


@views.route('/', methods=['GET'])
@login_required
def home():
    form = AddDataSetForm()
    return render_template("home.html", user=current_user, form=form)


@views.route('/details/<int:id>')
@login_required
def view_dataset(id):
    dataset_to_view = DataSet.query.get_or_404(id)
    form = AddDataSetForm()
    return render_template("view_dataset.html", user=current_user, dataset=dataset_to_view, form=form)


@views.route('/add', methods=['GET', 'POST'])
@login_required
def add():
    form = AddDataSetForm()
    if form.validate_on_submit():
        label = request.form.get('label')
        description = request.form.get('description')
        time_values = request.form.get('time_values')
        data_values = request.form.get('data_values')
        new_dataset = DataSet(label=label,
                              description=description,
                              time_values=time_values,
                              data_values=data_values,
                              user_id=current_user.id)
        db.session.add(new_dataset)
        db.session.commit()
        flash('Dataset added!', category='success')
        return render_template("home.html", user=current_user)
    else:
        return render_template("add_dataset.html", user=current_user, form=form)


@views.route('/delete/<int:id>')
def delete(id):
    dataset_to_delete = DataSet.query.get_or_404(id)
    try:
        db.session.delete(dataset_to_delete)
        db.session.commit()
        return redirect(url_for('views.home'))
    except Exception as e:
        return "There was a problem deleting that dataset: " + str(e)


# @views.route('/delete-dataset', methods=['POST'])
# def delete_dataset():
#     note = json.loads(request.data)
#     noteId = note['noteId']
#     note = DataSet.query.get(noteId)
#     if note:
#         if note.user_id == current_user.id:
#             db.session.delete(note)
#             db.session.commit()

#     return jsonify({})
