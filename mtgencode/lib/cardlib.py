# This Python file uses the following encoding: utf-8
# card representation
import re
import random
import string

import utils
import transforms
from manalib import Manacost, Manatext
from datetime import datetime

# Some text prettification stuff that people may not have installed
def titlecase(s):
    return re.sub(
        r"[A-Za-z]+('[A-Za-z]+)?|( (of|the|with|by|for|from|and|in|or|to|a|at| )+[^\w])",
        lambda word: word.group(0).capitalize(),
        s)

def sentencecase(s):
    #This regex finds certain characters, and then the word that follows it. Then capitalizes the word.
    #We find these characters: ^ (start of string), ", ., :, \n (newline), |, $, [, em-dash, •, =, !, ?, (, }
    #followed by any amount of whitespace
    #The last capture group ([A-Za-z]+) finds the word
    return re.sub(
        ur"((?:^|\"|\u2014|\.|:|\n|=|\||\$|\[|\u2022|!|\?|\(|},)\s*?)([A-Za-z]+)",
        lambda word: word.group(1) + word.group(2).capitalize(),
        s)

# These are used later to determine what the fields of the Card object are called.
# Define them here because they have nothing to do with the actual format.
field_name = 'name'
field_rarity = 'rarity'
field_cost = 'cost'
field_supertypes = 'supertypes'
field_types = 'types'
field_subtypes = 'subtypes'
field_loyalty = 'loyalty'
field_pt = 'pt'
field_text = 'text'
field_other = 'other' # it's kind of a pseudo-field
field_dfc = 'dfc'

# Import the labels, because these do appear in the encoded text.
field_label_name = utils.field_label_name
field_label_rarity = utils.field_label_rarity
field_label_cost = utils.field_label_cost
field_label_supertypes = utils.field_label_supertypes
field_label_types = utils.field_label_types
field_label_subtypes = utils.field_label_subtypes
field_label_loyalty = utils.field_label_loyalty
field_label_pt = utils.field_label_pt
field_label_text = utils.field_label_text
field_label_dfc = utils.field_label_dfc

fieldnames = [
    field_name,
    field_rarity,
    field_cost,
    field_supertypes,
    field_types,
    field_subtypes,
    field_loyalty,
    field_pt,
    field_text,
    field_dfc,
]

# legacy
fmt_ordered_old = [
    field_name,
    field_supertypes,
    field_types,
    field_loyalty,
    field_subtypes,
    field_rarity,
    field_pt,
    field_cost,
    field_text,
]
fmt_ordered_norarity = [
    field_name,
    field_supertypes,
    field_types,
    field_loyalty,
    field_subtypes,
    field_pt,
    field_cost,
    field_text,
]

# standard
fmt_ordered_default = [
    field_types,
    field_supertypes,
    field_subtypes,
    field_loyalty,
    field_pt,
    field_text,
    field_cost,
    field_rarity,
    field_name,
    field_dfc,
]

# minor variations
fmt_ordered_noname = [
    field_types,
    field_supertypes,
    field_subtypes,
    field_loyalty,
    field_pt,
    field_text,
    field_cost,
    field_rarity,
    field_dfc,
]
fmt_ordered_named = [
    field_name,
    field_types,
    field_supertypes,
    field_subtypes,
    field_loyalty,
    field_pt,
    field_text,
    field_cost,
    field_rarity,
    field_dfc,
]

fmt_labeled_default = {
    field_name : field_label_name,
    field_rarity : field_label_rarity,
    field_cost : field_label_cost,
    field_supertypes : field_label_supertypes,
    field_types : field_label_types,
    field_subtypes : field_label_subtypes,
    field_loyalty : field_label_loyalty,
    field_pt : field_label_pt,
    field_text : field_label_text,
    field_dfc : field_label_dfc,
}

# sanity test if a card's fields look plausible
def fields_check_valid(fields):
    # all cards must have a name and a type
    if not field_name in fields:
        return False
    if not field_types in fields:
        return False
    # creatures and vehicles have p/t, other things don't
    iscreature = False
    for idx, value in fields[field_types]:
        if 'creature' in value:
            iscreature = True
        elif field_subtypes in fields:
	    for idx, value in fields[field_subtypes]:
	        if 'vehicle' in value:
		    iscreature = True
    if iscreature:
        return field_pt in fields
    else:
        return not field_pt in fields


# These functions take a bunch of source data in some format and turn
# it into nicely labeled fields that we know how to initialize a card from.
# Both return a dict that maps field names to lists of possible values,
# paired with the index that we read that particular field value from.
# So, {fieldname : [(idx, value), (idx, value)...].
# Usually we want these lists to be length 1, but you never know.

# Of course to make things nice and simple, that dict is the third element
# of a triple that reports parsing success and valid success as its 
# first two elements.

# This whole things assumes the json format of mtgjson.com.

# Here's a brief list of relevant fields:
# name - string
# names - list (used for split, flip, and double-faced)
# manaCost - string
# cmc - number
# colors - list
# type - string (the whole big long damn thing)
# supertypes - list
# types - list
# subtypes - list
# text - string
# power - string
# toughness - string
# loyalty - number

# And some less useful ones, in case they're wanted for something:
# layout - string
# rarity - string
# flavor - string
# artist - string
# number - string
# multiverseid - number
# variations - list
# imageName - string
# watermark - string
# border - string
# timeshifted - boolean
# hand - number
# life - number
# reserved - boolean
# releaseDate - string
# starter - boolean

def fields_from_json(src_json, linetrans = True):
    parsed = True
    valid = True
    fields = {}

    # we hardcode in what the things are called in the mtgjson format
    if 'name' in src_json:
        name_val = src_json['name'].lower()
        name_orig = name_val
        name_val = transforms.name_pass_1_sanitize(name_val)
        name_val = utils.to_ascii(name_val)
        fields[field_name] = [(-1, name_val)]
    else:
        name_orig = ''
        parsed = False

    # return the actual Manacost object
    if 'manaCost' in src_json:
        cost =  Manacost(src_json['manaCost'], fmt = 'json')
        valid = valid and cost.valid
        parsed = parsed and cost.parsed
        fields[field_cost] = [(-1, cost)]

    if 'supertypes' in src_json:
        fields[field_supertypes] = [(-1, map(lambda s: utils.to_ascii(s.lower()), 
                                             src_json['supertypes']))]

    if 'types' in src_json:
        fields[field_types] = [(-1, map(lambda s: utils.to_ascii(s.lower()), 
                                        src_json['types']))]
    else:
        parsed = False

    if 'subtypes' in src_json:
        fields[field_subtypes] = [(-1, map(lambda s: utils.to_ascii(s.lower())
                                           # urza's lands...
                                           .replace('"', "'").replace('-', utils.dash_marker), 
                                           src_json['subtypes']))]
        

    if 'rarity' in src_json:
        if src_json['rarity'] in utils.json_rarity_map:
            fields[field_rarity] = [(-1, utils.json_rarity_map[src_json['rarity']])]
        else:
            fields[field_rarity] = [(-1, src_json['rarity'])]
            parsed = False
    else:
        parsed = False

    if 'loyalty' in src_json:
        fields[field_loyalty] = [(-1, utils.to_unary(str(src_json['loyalty'])))]

    p_t = ''
    parsed_pt = True
    if 'power' in src_json:
        p_t = utils.to_ascii(utils.to_unary(src_json['power'])) + '/' # hardcoded
        parsed_pt = False
        if 'toughness' in src_json:
            p_t = p_t + utils.to_ascii(utils.to_unary(src_json['toughness']))
            parsed_pt = True
    elif 'toughness' in src_json:
        p_t = '/' + utils.to_ascii(utils.to_unary(src_json['toughness'])) # hardcoded
        parsed_pt = False
    if p_t:
        fields[field_pt] = [(-1, p_t)]
    parsed = parsed and parsed_pt
        
    # similarly, return the actual Manatext object
    if 'text' in src_json:
        text_val = src_json['text'].lower()
        text_val = transforms.text_pass_1_strip_rt(text_val)
        text_val = transforms.text_pass_2_cardname(text_val, name_orig)
        text_val = transforms.text_pass_3_unary(text_val)
        text_val = transforms.text_pass_4a_dashes(text_val)
        text_val = transforms.text_pass_4b_x(text_val)
        text_val = transforms.text_pass_5_counters(text_val)
        text_val = transforms.text_pass_6_uncast(text_val)
        text_val = transforms.text_pass_7_choice(text_val)
        text_val = transforms.text_pass_8_equip(text_val)
        text_val = transforms.text_pass_9_newlines(text_val)
        text_val = transforms.text_pass_10_symbols(text_val)
        if linetrans:
            text_val = transforms.text_pass_11_linetrans(text_val)
        text_val = utils.to_ascii(text_val)
        text_val = text_val.strip()
        mtext = Manatext(text_val, fmt = 'json')
        valid = valid and mtext.valid
        fields[field_text] = [(-1, mtext)]
    
    # we don't need to worry about bsides because we handle that in the constructor
    return parsed, valid and fields_check_valid(fields), fields


def fields_from_format(src_text, fmt_ordered, fmt_labeled, fieldsep):
    parsed = True
    valid = True
    fields = {}

    if fmt_labeled:
        labels = {fmt_labeled[k] : k for k in fmt_labeled}
        field_label_regex = '[' + ''.join(labels.keys()) + ']'
    def addf(fields, fkey, fval):
        # make sure you pass a pair
        if fval and fval[1]:
            if fkey in fields:
                fields[fkey] += [fval]
            else:
                fields[fkey] = [fval]
    textfields = src_text.split(fieldsep)
    idx = 0
    true_idx = 0
    for textfield in textfields:
        # ignore leading or trailing empty fields due to seps
        if textfield == '':
            if true_idx == 0 or true_idx == len(textfields) - 1:
                true_idx += 1
                continue
            # count the field index for other empty fields but don't add them
            else:
                idx += 1
                true_idx += 1
                continue

        lab = None
        if fmt_labeled:
            labs = re.findall(field_label_regex, textfield)
            # use the first label if we saw any at all
            if len(labs) > 0:
                lab = labs[0]
                textfield = textfield.replace(lab, '', 1)
        # try to use the field label if we got one
        if lab and lab in labels:
            fname = labels[lab]
        # fall back to the field order specified
        elif idx < len(fmt_ordered):
            fname = fmt_ordered[idx]
        # we don't know what to do with this field: call it other
        else:
            fname = field_other
            parsed = False
            valid = False

        # specialized handling
        if fname in [field_cost]:
            fval = Manacost(textfield)
            parsed = parsed and fval.parsed
            valid = valid and fval.valid
            addf(fields, fname, (idx, fval))
        elif fname in [field_text]:
            fval = Manatext(textfield)
            valid = valid and fval.valid
            addf(fields, fname, (idx, fval))
        elif fname in [field_supertypes, field_types, field_subtypes]:
            addf(fields, fname, (idx, textfield.split()))
        else:
            addf(fields, fname, (idx, textfield))

        idx += 1
        true_idx += 1
        
    # again, bsides are handled by the constructor
    return parsed, valid and fields_check_valid(fields), fields

# Here's the actual Card class that other files should use.

class Card:
    '''card representation with data'''

    def __init__(self, src, fmt_ordered = fmt_ordered_default, 
                            fmt_labeled = fmt_labeled_default, 
                            fieldsep = utils.fieldsep, linetrans = True):

        # source fields, exactly one will be set
        self.json = None
        self.raw = None
        # flags
        self.parsed = True
        self.valid = True # doesn't record that much
        # placeholders to fill in with expensive distance metrics
        self.nearest_names = []
        self.nearest_cards = []
        # default values for all fields
        self.__dict__[field_name] = ''
        self.__dict__[field_rarity] = ''
        self.__dict__[field_cost] = Manacost('')
        self.__dict__[field_supertypes] = []
        self.__dict__[field_types] = []
        self.__dict__[field_subtypes] = []
        self.__dict__[field_loyalty] = ''
        self.__dict__[field_loyalty + '_value'] = None
        self.__dict__[field_pt] = ''
        self.__dict__[field_pt + '_p'] = None
        self.__dict__[field_pt + '_p_value'] = None
        self.__dict__[field_pt + '_t'] = None
        self.__dict__[field_pt + '_t_value'] = None
        self.__dict__[field_text] = Manatext('')
        self.__dict__[field_text + '_lines'] = []
        self.__dict__[field_text + '_words'] = []
        self.__dict__[field_text + '_lines_words'] = []
        self.__dict__[field_dfc] = []
        self.__dict__[field_other] = []
        self.bside = None
        # format-independent view of processed input
        self.fields = None # will be reset later

        # looks like a json object
        if isinstance(src, dict):
            self.json = src
            if utils.json_field_bside in src:
                self.bside = Card(src[utils.json_field_bside],
                                  fmt_ordered = fmt_ordered,
                                  fmt_labeled = fmt_labeled,
                                  fieldsep = fieldsep,
                                  linetrans = linetrans)
            p_success, v_success, parsed_fields = fields_from_json(src, linetrans = linetrans)
            self.parsed = p_success
            self.valid = v_success
            self.fields = parsed_fields
        # otherwise assume text encoding
        else:
            self.raw = src
            sides = src.split(utils.bsidesep)
            if len(sides) > 1 and len(sides[1]) > 5:
                self.bside = Card(utils.bsidesep.join(sides[1:]), 
                                  fmt_ordered = fmt_ordered,
                                  fmt_labeled = fmt_labeled,
                                  fieldsep = fieldsep,
                                  linetrans = linetrans)
            p_success, v_success, parsed_fields = fields_from_format(sides[0], fmt_ordered, 
                                                                     fmt_labeled,  fieldsep)
            self.parsed = p_success
            self.valid = v_success
            self.fields = parsed_fields
        # amusingly enough, both encodings allow infinitely deep nesting of bsides...

        # python name hackery
        if self.fields:
            for field in self.fields:
                # look for a specialized set function
                if hasattr(self, '_set_' + field):
                    getattr(self, '_set_' + field)(self.fields[field])
                # otherwise use the default one
                elif field in self.__dict__:
                    self.set_field_default(field, self.fields[field])
                # If we don't recognize the field, fail. This is a totally artificial
                # limitation; if we just used the default handler for the else case,
                # we could set arbitrarily named fields.
                else:
                    raise ValueError('python name mangling failure: unknown field for Card(): ' 
                                     + field)
        else:
            # valid but not parsed indicates that the card was apparently empty
            self.parsed = False

    # These setters are invoked via name mangling, so they have to match 
    # the field names specified above to be used. Otherwise we just
    # always fall back to the (uninteresting) default handler.

    # Also note that all fields come wrapped in pairs, with the first member
    # specifying the index the field was found at when parsing the card. These will
    # all be -1 if the card was parsed from (unordered) json.

    def set_field_default(self, field, values):
        first = True
        for idx, value in values:
            if first:
                first = False
                self.__dict__[field] = value
            else:
                # stick it in other so we'll be know about it when we format the card
                self.valid = False
                self.__dict__[field_other] += [(idx, '<' + field + '> ' + str(value))]

    def _set_loyalty(self, values):
        first = True
        for idx, value in values:
            if first:
                first = False
                self.__dict__[field_loyalty] = value
                try:
                    self.__dict__[field_loyalty + '_value'] = int(value)
                except ValueError:
                    self.__dict__[field_loyalty + '_value'] = None
                    # Technically '*' could still be valid, but it's unlikely...
            else:
                self.valid = False
                self.__dict__[field_other] += [(idx, '<loyalty> ' + str(value))]

    def _set_pt(self, values):
        first = True
        for idx, value in values:
            if first:
                first = False
                self.__dict__[field_pt] = value
                p_t = value.split('/') # hardcoded
                if len(p_t) == 2:
                    self.__dict__[field_pt + '_p'] = p_t[0]
                    try:
                        self.__dict__[field_pt + '_p_value'] = int(p_t[0])
                    except ValueError:
                        self.__dict__[field_pt + '_p_value'] = None
                    self.__dict__[field_pt + '_t'] = p_t[1]
                    try:
                        self.__dict__[field_pt + '_t_value'] = int(p_t[1])
                    except ValueError:
                        self.__dict__[field_pt + '_t_value'] = None
                else:
                    self.valid = False
            else:
                self.valid = False
                self.__dict__[field_other] += [(idx, '<pt> ' + str(value))]
    
    def _set_text(self, values):
        first = True
        for idx, value in values:
            if first:
                first = False
                mtext = value
                self.__dict__[field_text] = mtext
                fulltext = mtext.encode()
                if fulltext:
                    self.__dict__[field_text + '_lines'] = map(Manatext, 
                                                               fulltext.split(utils.newline))
                    self.__dict__[field_text + '_words'] = re.sub(utils.unletters_regex, 
                                                                  ' ', 
                                                                  fulltext).split()
                    self.__dict__[field_text + '_lines_words'] = map(
                        lambda line: re.sub(utils.unletters_regex, ' ', line).split(),
                        fulltext.split(utils.newline))
            else:
                self.valid = False
                self.__dict__[field_other] += [(idx, '<text> ' + str(value))]
        
    def _set_other(self, values):
        # just record these, we could do somthing unset valid if we really wanted
        for idx, value in values:
            self.__dict__[field_other] += [(idx, value)]

    # Output functions that produce various formats. encode() is specific to
    # the NN representation, use str() or format() for output intended for human
    # readers.

    def encode(self, fmt_ordered = fmt_ordered_default, fmt_labeled = fmt_labeled_default, 
               fieldsep = utils.fieldsep, initial_sep = True, final_sep = True,
               randomize_fields = False, randomize_mana = False, randomize_lines = False):
        outfields = []

        for field in fmt_ordered:
            if field in self.__dict__:
                outfield = self.__dict__[field]
                if outfield:
                    # specialized field handling for the ones that aren't strings (sigh)
                    if isinstance(outfield, list):
                        outfield_str = ' '.join(outfield)
                    elif isinstance(outfield, Manacost):
                        outfield_str = outfield.encode(randomize = randomize_mana)
                    elif isinstance(outfield, Manatext):
                        outfield_str = outfield.encode(randomize = randomize_mana)
                        if randomize_lines:
                            outfield_str = transforms.randomize_lines(outfield_str)
                    else:
                        outfield_str = outfield
                else:
                    outfield_str = ''

                if fmt_labeled and field in fmt_labeled:
                        outfield_str = fmt_labeled[field] + outfield_str

                outfields += [outfield_str]

            else:
                raise ValueError('unknown field for Card.encode(): ' + str(field))

        if randomize_fields:
            random.shuffle(outfields)
        if initial_sep:
            outfields = [''] + outfields
        if final_sep:
            outfields = outfields + ['']

        outstr = fieldsep.join(outfields)

        if self.bside:
            outstr = (outstr + utils.bsidesep 
                      + self.bside.encode(fmt_ordered = fmt_ordered,
                                          fmt_labeled = fmt_labeled,
                                          fieldsep = fieldsep,
                                          randomize_fields = randomize_fields, 
                                          randomize_mana = randomize_mana,
                                          initial_sep = initial_sep, final_sep = final_sep))

        return outstr

    def format(self, gatherer = False, for_forum = False, vdump = False, for_html = False):
        linebreak = '\n'
        outstr = ''
        if for_html:
            linebreak = '<hr>' + linebreak

        else:
            cardname = titlecase(transforms.name_unpass_1_dashes(self.__dict__[field_name]))
            
            if vdump and not cardname:
                cardname = '_NONAME_'
            outstr += cardname

            coststr = self.__dict__[field_cost].format(for_forum=for_forum, for_html=for_html)
            if vdump or not coststr == '_NOCOST_':
                outstr += ' ' + coststr

            if vdump:
                if not self.parsed:
                    outstr += ' _UNPARSED_'
                if not self.valid:
                    outstr += ' _INVALID_'
            
            outstr += linebreak

            typeline = ' '.join(self.__dict__[field_supertypes] + self.__dict__[field_types]).title()
            if self.__dict__[field_subtypes]:
                typeline += ' ' + utils.dash_marker + ' ' + ' '.join(self.__dict__[field_subtypes]).title()
            outstr += typeline

            if self.__dict__[field_rarity]:
                if self.__dict__[field_rarity] in utils.json_rarity_unmap:
                    rarity = utils.json_rarity_unmap[self.__dict__[field_rarity]]
                else:
                    rarity = self.__dict__[field_rarity]
                outstr += ' (' + rarity.lower() + ')'
            
            if self.__dict__[field_text].text:
                outstr += linebreak

                mtext = self.__dict__[field_text].text
                mtext = transforms.text_unpass_1_choice(mtext, delimit = True)
                mtext = transforms.text_unpass_2_counters(mtext)
                mtext = transforms.text_unpass_3_uncast(mtext)
                mtext = transforms.text_unpass_4_unary(mtext)
                mtext = transforms.text_unpass_5_symbols(mtext, for_forum, for_html)
                mtext = transforms.text_unpass_6_cardname(mtext, cardname)
                mtext = transforms.text_unpass_7_newlines(mtext)
                mtext = transforms.text_unpass_8_unicode(mtext)
                newtext = Manatext('')
                newtext.text = mtext
                newtext.costs = self.__dict__[field_text].costs
                
                newtext = newtext.format(for_forum=for_forum, for_html=for_html)
                newtext = sentencecase(newtext)

                outstr += newtext
                #.format(for_forum=for_forum, for_html=for_html)

            if self.__dict__[field_pt]:
                outstr += linebreak
                outstr += '(' + utils.from_unary(self.__dict__[field_pt]) + ')'

            if self.__dict__[field_loyalty]:
                outstr += linebreak
                outstr += '((' + utils.from_unary(self.__dict__[field_loyalty]) + '))'
                
            if vdump and self.__dict__[field_other]:
                outstr += linebreak

                if for_html:
                    outstr += '<i>'
                else:
                    outstr += utils.dash_marker * 2

                first = True
                for idx, value in self.__dict__[field_other]:
                    if for_html:
                        if not first:
                            outstr += '<br>\n'
                        else:
                            first = False
                    else:
                        outstr += linebreak
                    outstr += '(' + str(idx) + ') ' + str(value)

                if for_html:
                    outstr += '</i>'

        if self.bside:
            if for_html:
                outstr += '\n'
                # force for_forum to false so that the inner div doesn't duplicate the forum
                # spoiler of the bside
                outstr += self.bside.format(gatherer=gatherer, for_forum=False, for_html=for_html, vdump=vdump)
            else:
                outstr += linebreak
                outstr += utils.dash_marker * 8
                outstr += linebreak
                outstr += self.bside.format(gatherer=gatherer, for_forum=for_forum, for_html=for_html, vdump=vdump)

        # if for_html:
        #     if for_forum:
        #         outstr += linebreak
        #         # force for_html to false to create a copyable forum spoiler div
        #         outstr += ('<div>' 
        #                    + self.format(gatherer=gatherer, for_forum=for_forum, for_html=False, vdump=vdump).replace('\n', '<br>')
        #                    + '</div>')
        if for_html:
            outstr += "</div>"

        return outstr
    
    def to_mse(self, print_raw = False, vdump = False):
        outstr = ''

        # need a 'card' string first
        outstr += 'card:\n'

        cardname = titlecase(transforms.name_unpass_1_dashes(self.__dict__[field_name]))
        outstr += '\tname: ' + cardname + '\n'

        if self.__dict__[field_rarity]:
            if self.__dict__[field_rarity] in utils.json_rarity_unmap:
                rarity = utils.json_rarity_unmap[self.__dict__[field_rarity]]
            else:
                rarity = self.__dict__[field_rarity]
            outstr += '\trarity: ' + rarity.lower() + '\n'

        if not self.__dict__[field_cost].none:            
            outstr += ('\tcasting_cost: ' 
                       + self.__dict__[field_cost].format().replace('{','').replace('}','').replace('P','H') 
                       + '\n')

        outstr += '\tsuper_type: ' + ' '.join(self.__dict__[field_supertypes] 
                                              + self.__dict__[field_types]).title() + '\n'
        if self.__dict__[field_subtypes]:
            outstr += '\tsub_type: ' + ' '.join(self.__dict__[field_subtypes]).title() + '\n'

        if self.__dict__[field_pt]:
            ptstring = utils.from_unary(self.__dict__[field_pt]).split('/')
            if (len(ptstring) > 1): # really don't want to be accessing anything nonexistent.
                outstr += '\tpower: ' + ptstring[0] + '\n'
                outstr += '\ttoughness: ' + ptstring[1] + '\n'

        if self.__dict__[field_text].text:
            mtext = self.__dict__[field_text].text
            mtext = transforms.text_unpass_1_choice(mtext, delimit = False)
            mtext = transforms.text_unpass_2_counters(mtext)
            mtext = transforms.text_unpass_3_uncast(mtext)
            mtext = transforms.text_unpass_4_unary(mtext)
            mtext = transforms.text_unpass_5_symbols(mtext, False, False)
            # I don't really want these MSE specific passes in transforms,
            # but they could be pulled out separately somewhere else in here.
            if 'Legendary' in outstr:
                mtext = mtext.replace(utils.this_marker, '<atom-legname><nospellcheck>' + utils.this_marker + '</nospellcheck></atom-legname>')
            else:
                mtext = mtext.replace(utils.this_marker, '<atom-cardname><nospellcheck>' + utils.this_marker + '</nospellcheck></atom-cardname>')
            mtext = transforms.text_unpass_6_cardname(mtext, cardname)
            mtext = transforms.text_unpass_7_newlines(mtext)
            mtext = transforms.text_unpass_8_unicode(mtext)
            newtext = Manatext('')
            newtext.text = mtext
            newtext.costs = self.__dict__[field_text].costs
            newtext = newtext.format()
            newtext = sentencecase(newtext.replace('P','H'))
            outstr += '\tnotes:\n\t\t' + newtext.replace('\n', '\n\t\t') + '\n'
            #fix missing brackets
            newtext = re.sub(r'({([WUBRGCPHX\dES^/TQ]*)}?)', "{" + r"\2" + "}", newtext)
            #fix regular numbers becoming symbols
            newtext = re.sub(r'(?<!{|\+|-|\[)([\dX]+(/\d)?)(?!\])', "<\sym>" + r"\1", newtext)
            #find ability words and italicize them
            #newtext = re.sub(r'^(?!Choose)([\w, ]*) ' + u'\u2014', "<i>" + r"\1" + "</i> " + u'\u2014', newtext)
            newtext = re.sub(r'^(?!.*choose)([\w, ]*?)' + u'\u2014', "<i>" + r"\1" + "</i>" + u'\u2014', newtext, flags = re.I | re.M)
            outstr += '\tnotes:\n\t\t' + newtext.replace('\n', '\n\t\t') + '\n'
            
            # See, the thing is, I think it's simplest and easiest to just leave it like this.
            # What could possibly go wrong?
            newtext = newtext.replace('{','<sym>').replace('}','</sym>')
            
            
        else:
            newtext = ''

        # Annoying special case for bsides;
        # This could be improved by having an intermediate function that returned
        # all of the formatted fields in a data structure and a separate wrapper
        # that actually packed them into the MSE format.
        if self.bside:
            # Need to run split twice for b-sides, once for each side
            split = newtext.split('$$')
            newtext = split[0].replace('\n','\n\t\t')
            outstr += '\trule_text:\n\t\t' + newtext + '\n'
            if len(split) > 1:
                outstr += '\tflavor_text: \n\t\t<i-flavor>' + split[1].replace('\n','\n\t\t') + '</i-flavor>\n'
            
            if "adventure" in ' '.join(self.bside.__dict__[field_subtypes]):
                outstr += '\tstylesheet: m15-adventure\n'
            elif "aftermath" in self.bside.__dict__[field_text].text:
                outstr += '\tstylesheet: m15-aftermath\n'
            else:
                outstr += '\tstylesheet: m15-mainframe-dfc\n'

            cardname2 = titlecase(transforms.name_unpass_1_dashes(
                self.bside.__dict__[field_name]))

            outstr += '\tname_2: ' + cardname2 + '\n'
            if self.bside.__dict__[field_rarity]:
                if self.bside.__dict__[field_rarity] in utils.json_rarity_unmap:
                    rarity2 = utils.json_rarity_unmap[self.bside.__dict__[field_rarity]]
                else:
                    rarity2 = self.bside.__dict__[field_rarity]
                outstr += '\trarity_2: ' + rarity2.lower() + '\n'

            if not self.bside.__dict__[field_cost].none:            
                outstr += ('\tcasting_cost_2: ' 
                           + self.bside.__dict__[field_cost].format()
                           .replace('{','').replace('}','').replace('P','H')
                           + '\n')

            outstr += ('\tsuper_type_2: ' 
                       + ' '.join(self.bside.__dict__[field_supertypes] 
                                  + self.bside.__dict__[field_types]).title() + '\n')

            if self.bside.__dict__[field_subtypes]:
                outstr += ('\tsub_type_2: ' 
                           + ' '.join(self.bside.__dict__[field_subtypes]).title() + '\n')

            if self.bside.__dict__[field_pt]:
                ptstring2 = utils.from_unary(self.bside.__dict__[field_pt]).split('/')
                if (len(ptstring2) > 1): # really don't want to be accessing anything nonexistent.
                    outstr += '\tpower_2: ' + ptstring2[0] + '\n'
                    outstr += '\ttoughness_2: ' + ptstring2[1] + '\n'

            if self.bside.__dict__[field_text].text:
                mtext2 = self.bside.__dict__[field_text].text
                mtext2 = transforms.text_unpass_1_choice(mtext2, delimit = False)
                mtext2 = transforms.text_unpass_2_counters(mtext2)
                mtext2 = transforms.text_unpass_3_uncast(mtext2)
                mtext2 = transforms.text_unpass_4_unary(mtext2)
                mtext2 = transforms.text_unpass_5_symbols(mtext2, False, False)
                if 'legendary' in outstr:
                    mtext2 = mtext2.replace(utils.this_marker, '<atom-legname><nospellcheck>' + utils.this_marker + '</nospellcheck></atom-legname>')
                else:
                    mtext2 = mtext2.replace(utils.this_marker, '<atom-cardname><nospellcheck>' + utils.this_marker + '</nospellcheck></atom-cardname>')
                mtext2 = transforms.text_unpass_6_cardname(mtext2, cardname2)
                mtext2 = transforms.text_unpass_7_newlines(mtext2)
                mtext2 = transforms.text_unpass_8_unicode(mtext2)
                newtext2 = Manatext('')
                newtext2.text = mtext2
                newtext2.costs = self.bside.__dict__[field_text].costs
                newtext2 = newtext2.format()
                newtext2 = sentencecase(newtext2.replace('P','H').replace(']', '').replace('[', ''))
                
                #fix missing brackets
                newtext2 = re.sub(r'({([WUBRGCPHX\dES^/TQ]*)}?)', "{" + r"\2" + "}", newtext2)
                #fix regular numbers becoming symbols
                newtext2 = re.sub(r'(?<!{|\+|-|\[)([\dX]+(/\d)?)(?!\])', "<\sym>" + r"\1", newtext2)
                #find ability words and italicize them
                newtext2 = re.sub(r'^(?!.*choose)([\w, ]*?)' + u'\u2014', "<i>" + r"\1" + "</i>" + u'\u2014', newtext2, flags = re.I | re.M)
                # See, the thing is, I think it's simplest and easiest to just leave it like this.
                # What could possibly go wrong?
                newtext2 = newtext2.replace('{','<sym>').replace('}','</sym>')
                    
                # Need to run split twice for b-sides, once for each side
                split = newtext2.split('$$')
                newtext2 = split[0].replace('\n','\n\t\t')
                outstr += '\trule_text_2:\n\t\t' + newtext2 + '\n'
                if len(split) > 1:
                    outstr += '\tflavor_text_2: \n\t\t<i-flavor>' + split[1].replace('\n','\n\t\t') + '</i-flavor>\n'

        # Need to do Special Things if it's a planeswalker.
        # This code mostly works, but it won't get quite the right thing if the planeswalker
        # abilities don't come before any other ones. Should be fixed.
        elif "planeswalker" in str(self.__dict__[field_types]):
            outstr += '\tstylesheet: m15-mainframe-planeswalker\n'
            
            # put a newline char before flavortext delim
            # also remove +/- from 0 cost
            newtext = newtext.replace('$$', '\n$$')

            # set up the loyalty cost fields using regex to find how many there are.
            i = 0
            lcost_regex = r'([-+]?\d+)]: ' # 1+ figures, might be 0.
            for lcost in re.findall(lcost_regex, newtext):
                i += 1
                outstr += '\tloyalty_cost_' + str(i) + ': ' + lcost + '\n'
            # sub out the loyalty costs.
            newtext = re.sub(lcost_regex, '', newtext)

            # We need to uppercase again, because MSE won't magically capitalize for us
            # like it does after semicolons.
            # Abusing passes like this is terrible, should really fix sentencecase.
            # newtext = transforms.text_pass_9_newlines(newtext)
            # newtext = sentencecase(newtext)
            # newtext = transforms.text_unpass_7_newlines(newtext)

            if self.__dict__[field_loyalty]:
                outstr += '\tloyalty: ' + utils.from_unary(self.__dict__[field_loyalty]) + '\n'
            
            # setup string to catch any abilities that don't have loyalty costs
            # then iterate through each line of rules. Any starting with '[' is a loyalty ability
            nonloyal = ''
            x = 0
            for abilities in newtext.split('\n'):
                if abilities.startswith('['):
                    x += 1
                    outstr += '\tlevel_' + str(x) + '_text: <margin:130:0:0>' + abilities[len('['):] + '</margin:130:0:0>\n'
                else:
                    nonloyal += '\t\t' + abilities + '\n'
                    
            nonloyal = nonloyal.split('\t\t$$')
            #add non-loyalty abilities to the card
            if len(nonloyal[0]) > 4:
                x += 1
                outstr += '\tlevel_' + str(x) + '_text:\n' + nonloyal[0] + '\n'
            #add flavor text to a new field
            if len(nonloyal) > 1:    
                x += 1  
                nonloyal[1] = '\t\t<i-flavor>' + nonloyal[1][:-1] + '<i-flavor>'            
                outstr += '\tlevel_' + str(x) + '_text:\n' + nonloyal[1] + '\n'
            # set ability count for card styling
            outstr += '\thas_styling: true\n\tstyling_data:\n\t\t'
            if x == 1:
                outstr += 'override_levels: one ability\n'
            if x == 2:
                outstr += 'override_levels: two abilities\n'
            if x == 3:
                outstr += 'override_levels: three abilities\n'
            if x == 4:
                outstr += 'override_levels: four abilities\n'
            if x == 5:
                outstr += 'override_levels: five abilities\n'
            if x == 6:
                outstr += 'override_levels: six abilities\n'

        else:
            split = newtext.split('$$')
            newtext = split[0].replace('\n','\n\t\t').replace('[0]', '[+0]').replace(']', '').replace('[', '')
            outstr += '\trule_text:\n\t\t' + newtext + '\n'
            if len(split) > 1:
                outstr += '\tflavor_text: \n\t\t<i-flavor>' + split[1].replace('\n','\n\t\t') + '</i-flavor>\n'
            outstr += '\thas_styling: true\n'
            outstr += '\tstyling_data:\n'
            if "Devoid\n" in newtext:
                outstr += '\t\tframes: devoid\n'

        # now append all the other useless fields that the setfile expects.
        outstr += '\ttime_created: ' + str(datetime.now())[:-7] + '\n\ttime_modified: ' + str(datetime.now())[:-7] + '\n\timage:\n\tcard_code_text:\n\tcopyright:\n\timage_2:\n\tcopyright_2:\n\tnotes:'

        return outstr

    def vectorize(self):
        ld = '('
        rd = ')'
        outstr = ''

        if self.__dict__[field_rarity]:
            outstr += ld + self.__dict__[field_rarity] + rd + ' '

        coststr = self.__dict__[field_cost].vectorize(delimit = True)
        if coststr:
            outstr += coststr + ' '

        typestr = ' '.join(map(lambda s: '(' + s + ')',
                               self.__dict__[field_supertypes] + self.__dict__[field_types]))
        if typestr:
            outstr += typestr + ' '

        if self.__dict__[field_subtypes]:
            outstr += ' '.join(self.__dict__[field_subtypes]) + ' '

        if self.__dict__[field_pt]:
            outstr += ' '.join(map(lambda s: '(' + s + ')',
                                   self.__dict__[field_pt].replace('/', '/ /').split()))
            outstr += ' '
        
        if self.__dict__[field_loyalty]:
            outstr += '((' + self.__dict__[field_loyalty] + ')) '
            
        outstr += self.__dict__[field_text].vectorize()

        if self.bside:
            outstr = '_ASIDE_ ' + outstr + '\n\n_BSIDE_ ' + self.bside.vectorize()

        return outstr
            
    def get_colors(self):
        return self.__dict__[field_cost].get_colors()

    def get_types(self):
        return self.__dict__[field_types]

    def get_cmc(self):
        return self.__dict__[field_cost].cmc

        
