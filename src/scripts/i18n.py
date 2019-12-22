import pandas as pandas

# --------------------------------------- CONSTANTS ---------------------------------------

EXCEL_DIRECTORY = r'D:\Documentos\Drive\Trabajo\3.ingenieria_informatica\Personal\4.cuarto\tfg\Intentos\corpuser\src\assets\i18n\i18n.xlsx'
ES_FILE = 'src/assets/i18n/client/es.json'
EN_FILE = 'src/assets/i18n/client/en.json'
KEY = 0
SPANISH = 1
ENGLISH = 2


# --------------------------------------- PROCESS INITIALIZATIONS ---------------------------------------

data = pandas.read_excel (EXCEL_DIRECTORY)
final_es = {}
final_en = {}


# --------------------------------------- MAIN PROCESS ---------------------------------------

print('i18N UPDATE PROCESS: ', len(data.values), " literals to translate")
for translation in data.values:
    key_splitted = translation[KEY].split(".")
    value_es = final_es
    value_en = final_en
    i = 0
    for phase in key_splitted:
        if(phase in value_es):
            value_es = value_es[phase]
            value_en = value_en[phase]
        else:
            if i == len(key_splitted)-1:
                value_es[phase] = translation[SPANISH]
                value_en[phase] = translation[ENGLISH]
                value_es = final_es
                value_en = final_en
            else:
                value_es[phase] = {}
                value_en[phase] = {}
                value_es = value_es[phase]
                value_en = value_en[phase]
        i = i+1

import json
with open(ES_FILE, 'w') as es_file:
    json.dump(final_es, es_file)
print('GENERATED FILE: ', ES_FILE)

import json
with open(EN_FILE, 'w') as en_file:
    json.dump(final_en, en_file)
print('GENERATED FILE: ', EN_FILE)
