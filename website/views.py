import os
from flask import Blueprint, render_template, request, flash, jsonify, redirect, url_for, send_from_directory
from flask_login import login_required, current_user
from .models import DataSet
from .forms import AddDataSetForm
from . import db
from .predefined_data import add_predefined
from .util import to_bool, table_to_csv, csv_to_list

views = Blueprint('views', __name__)


@views.route('/favicon.ico')
def fav():
    return send_from_directory(os.path.join(views.root_path, 'static'), 'favicon.ico')


@views.route('/update_predef')
def update_predef():
    try:
        add_predefined()
        flash('Public datasets updated!', category='success')
    except Exception as e:
        flash(f'There was an error updating the database: {e}', category='error')
    return redirect(url_for('views.home'))


# @views.route('/', methods=['GET'])
# @login_required
# def home():
#     form = AddDataSetForm()
#     return render_template("home.html", user=current_user, form=form)


@views.route('/', methods=['GET'])
def landing():
    return render_template("landing.html")


@views.route('/home', methods=['GET'])
def home():
    return render_template("home.html", user=current_user)


@views.route('/get_for_plot/<ids>')
def get_for_plot(ids):
    ids_list = ids.split(',')
    return _get_for_plot(ids_list)


# @views.route('/get_for_plot_predef/<csv_list:ids_predef>')
# @login_required
# def get_for_plot_predef(ids_predef):
#     print(ids_predef)
#     return _get_for_plot(ids_predef, is_predef=True)


# @views.route('/get_for_plot_user/<csv_list:ids>')
# @login_required
# def get_for_plot_user(ids):
#     return _get_for_plot(ids, is_predef=False)


def _get_for_plot(ids):
    # ids is a list of integers (for user's data (id)) and strings (predefined data (id_predef))
    xydata = []  # List of dicts
    legends = []  # List of strings
    data_is_qualitative = []
    ind = 0
    for id in ids:
        if str.isdigit(id):
            dataset = DataSet.query.get_or_404(int(id))
        else:
            dataset = DataSet.query.filter(DataSet.id_predef == id).first_or_404()
        times = csv_to_list(dataset.time_values)
        datas = csv_to_list(dataset.data_values)

        for x, y in zip(times, datas):
            # x = time.strip()[1:-1]  # Remove the quotation marks
            # y = data.strip()[1:-1]  # Remove the quotation marks

            if dataset.data_is_qualitative:
                xydata.append({"time" + str(ind): x,
                               "value" + str(ind): "0",
                               "text" + str(ind): y})
            elif len(y) > 0:
                xydata.append({"time" + str(ind): x,
                               "value" + str(ind): y})
            else:  # amCharts interprets empty string as zero - for "no value" we need to omit the key "value"
                xydata.append({"time" + str(ind): x})
        ind += 1
        legend = dataset.legend
        if dataset.data_scale is not None:
            legend = legend + " (10^" + str(dataset.data_scale) + " " + dataset.data_unit + ")"
        elif dataset.data_unit is not None:
            legend = legend + " (" + dataset.data_unit + ")"
        legends.append(legend)
        data_is_qualitative.append(dataset.data_is_qualitative)

    # Cannot return the list, must return a json
    return jsonify(xydata=xydata, legends=legends, data_is_qualitative=data_is_qualitative)


@views.route('/details/<int:id>')
@login_required
def view_dataset(id):
    dataset_to_view = DataSet.query.get_or_404(id)
    form = AddDataSetForm()
    return render_template("view_dataset.html", user=current_user, dataset=dataset_to_view, form=form)


@views.route('/update/<int:id>', methods=['POST', 'GET'])
@login_required
def update_dataset(id):
    dataset_to_update = DataSet.query.get_or_404(id)
    form = AddDataSetForm()
    if form.validate_on_submit():  # Update the dataset

        # This may not respect the order of the values, so instead use table_to_csv (util.table_to_lists)
        # time_values = request.form.getlist("time_value")
        # data_values = request.form.getlist("data_value")
        time_values, data_values = table_to_csv(request.form)
        dataset_to_update.time_values = time_values
        dataset_to_update.data_values = data_values

        dataset_to_update.label = request.form.get('label')
        dataset_to_update.description = request.form.get('description')
        dataset_to_update.data_is_qualitative = to_bool(request.form.get('data_is_qualitative'))
        dataset_to_update.legend = request.form.get('legend')
        dataset_to_update.data_unit = request.form.get('data_unit')
        try:
            db.session.commit()
            flash('Dataset updated!', category='success')
        except Exception as e:
            db.session.rollback()
            flash(f'There was an error updating the dataset: {e}', category='error')
        return render_template("home.html", user=current_user)
    else:  # Render update_dataset
        # for key in ['label', 'description', 'time_values', 'data_values', 'data_unit', 'legend']:
        #     form[key].data = dataset_to_update[key]
        form.label.data = dataset_to_update.label
        form.description.data = dataset_to_update.description
        # form.time_values.data = dataset_to_update.time_values
        # form.data_values.data = dataset_to_update.data_values
        form.data_is_qualitative.data = dataset_to_update.data_is_qualitative
        form.data_unit.data = dataset_to_update.data_unit
        form.legend.data = dataset_to_update.legend
        return render_template("update_dataset.html", user=current_user, dataset=dataset_to_update, form=form)


# label = StringField("Label (displayed in list of datasets):", default="",
#                         validators=[DataRequired(), Length(min=3, max=LABEL_MAXLENGTH)])
#     description = TextAreaField("Description:",
#                                 validators=[Length(max=DESCRIPTION_MAXLENGTH)])
#     time_values = TextAreaField("Time values:",
#                                 validators=[DataRequired(), Length(max=DATA_MAXLENGTH)])
#     data_values = TextAreaField("Data values:",
#                                 validators=[DataRequired(), Length(max=DATA_MAXLENGTH)])
#     data_unit = SelectField("Unit for data values", choices=[("kg", 'kg'), ("m", 'm'), ("m2", 'm2')],
#                             validators=[DataRequired()])
#     legend = StringField("String for legend in graph:",
#                          validators=[DataRequired(), Length(min=3, max=LABEL_MAXLENGTH)])

@views.route('/add', methods=['GET', 'POST'])
@login_required
def add():
    form = AddDataSetForm()
    # if request.method == 'POST':
    if form.validate_on_submit():
        label = request.form.get('label')
        description = request.form.get('description')

        # This may not respect the order of the values, so instead use table_to_lists
        # time_values = request.form.getlist("time_value")
        # data_values = request.form.getlist("data_value")
        time_values, data_values = table_to_csv(request.form)

        # request.form.get('data_is_qualitative') is None if checkbox unchecked, and 'y' if checked. Weird.
        data_is_qualitative = to_bool(request.form.get('data_is_qualitative'))

        legend = request.form.get('legend')
        data_unit = request.form.get('data_unit')
        new_dataset = DataSet(label=label,
                              description=description,
                              time_values=time_values,
                              data_values=data_values,
                              data_is_qualitative=data_is_qualitative,
                              legend=legend,
                              data_unit=data_unit,
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
