# import re

TIME_VALUE = 'time_value'
DATA_VALUE = 'data_value'


def list_to_csv(x):
    """Create a comma-separated string representing the specified list."""
    if x is None:  # XXX
        return ""
    x_quotes = list()
    for s in x:
        if s is not None:
            x_quotes.append('"' + s + '"')
        else:
            x_quotes.append('""')
    # x_quotes = ['"' + s + '"' for s in x]
    return ','.join(x_quotes)
    # print(s)
    # input()

    # # Remove strange carriage returns (Windows)
    # s = s.replace('\r', '')

    # # Replace newline with comma
    # s = s.replace('\n', ',')

    # # Replace multiple spaces with a single one
    # s = ' '.join(s.split())

    # # Split with respect to comma, semicolon, space, and tab
    # # s_list = re.split(r'[,;\t ]', s)
    # return s  # ','.join(s_list)


def to_bool(s):
    """Return True if the specified string is 'y' and False if it is None. Assertion False otherwise."""
    if s is None:
        return False
    elif s == 'y':
        return True
    else:
        assert(False), "Internal error."


def table_to_lists(form):
    """
    Find the form items with name 'time_value0', 'time_value1', etc. and return a
    list of their corresponding values, ordered by the number after 'time_value'.
    The same for 'data_value0', 'data_value1', etc.
    """
    time_values_unsorted = list()
    data_values_unsorted = list()
    max_index_time = 0
    max_index_data = 0
    for name, value in form.items():
        if name.startswith(TIME_VALUE):
            index_str = name[len(TIME_VALUE):]
            index = int(index_str)
            time_values_unsorted.append((index, value))
            max_index_time = max(max_index_time, index)
        if name.startswith(DATA_VALUE):
            index_str = name[len(DATA_VALUE):]
            index = int(index_str)
            data_values_unsorted.append((index, value))
            max_index_data = max(max_index_data, index)
    assert(max_index_time == max_index_data), f"{max_index_time} != {max_index_data}"
    max_index = max_index_time
    time_values = list([None] * (max_index + 1))
    data_values = list([None] * (max_index + 1))
    for index_and_value in time_values_unsorted:
        index, value = index_and_value
        time_values[index] = value
    for index_and_value in data_values_unsorted:
        index, value = index_and_value
        data_values[index] = value
    assert(None not in time_values), f"None is in {time_values}"
    assert(None not in data_values), f"None is in {data_values}"

    return time_values, data_values
