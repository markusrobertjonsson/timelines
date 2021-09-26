import re


def to_csv(s):
    """Split the specified string with respect to a number of delimiter"""
    # Remove strange carriage returns (Windows)
    s = s.replace('\r', '')

    # Replace newline with comma
    s = s.replace('\n', ',')

    # Replace multiple spaces with a single one
    s = ' '.join(s.split())

    # Split with respect to comma, semicolon, space, and tab
    #s_list = re.split(r'[,;\t ]', s)
    return s  # ','.join(s_list)


def to_bool(s):
    """Return True if the specified string is 'y' and False if it is None. Assertion False otherwise."""
    if s is None:
        return False
    elif s == 'y':
        return True
    else:
        assert(False), "Internal error."
