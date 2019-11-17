import { Injectable } from '@angular/core';
import { Client } from 'elasticsearch-browser';
import { BehaviorSubject } from 'rxjs';

const ELASTIC_ENDPOINT = 'http://localhost:9200';

@Injectable({
  providedIn: 'root'
})
export class ElasticsearchService {


  private client: Client;
  queryalldocs = {
    'query': {
      'match_all': {}
    }
  };

  private selectedIndex = '';
  public indexSub;


  constructor() {

    this.selectedIndex = '';
    if (!this.client) {
      this.connect();
    }
    this.indexSub = new BehaviorSubject(this.selectedIndex);

  }


  /**
   * Creates a connection with the Elasticsearch server
   */
  private connect() {
    this.client = new Client({
      host: ELASTIC_ENDPOINT,
      log: 'trace'
    });
  }

  // TODO: What does it do??!?
  /**
   * ?!?
   */
  public getIndex(): string {
    return this.indexSub.getValue();
  }


  /**
   * Sets the index param as the selected one
   * @param index Index to be selected
   */
  public setIndex(index: string) {
    this.selectedIndex = index;
    this.indexSub.next(this.selectedIndex);
  }


  /**
   * Retrieves a list of all indices with their document counts
   */
  public getIndexListWithDocCount(): Object[] {

    const indices = [];

    this.client.cat.indices({
      format: 'json'
    }).then(response => {
      response.map((index) =>
        (indices.push({
          'index': index['index'],
          'docs.count': index['docs.count']
        })));
    });

    return indices;
  }



  /**
   * Counts the total amount of documents in the index
   * @param index Index name to count documents from
   */
  public countDocs(index: any): any {
    this.client.cat.count({
      index: index,
      format: 'json'
    }).then(response => {
      console.log(response);
      return response[0].count;
    }, error => {
      console.error('[ElasticsearchService] There was an error trying to count the number of documents in the index ' + index);
      return -1;
    });
  }


  /**
   * Creates an index
   * @param indexName Index name
   */
  public createIndex(indexName: string): any {

    const body = {
      index: indexName,
      body: {
        'mappings': {
          'doc': {
            'properties': {
              'attachment': {
                'properties': {
                  'content': {
                    'type': 'text',
                    'term_vector': 'with_positions_offsets_payloads',
                    'store': true,
                    'analyzer': 'fulltext_analyzer'
                  }
                }
              }
            },
            '_source': {
              'excludes': ['data']
            }
          }
        },
        'settings': {
          'index': {
            'number_of_shards': 1,
            'number_of_replicas': 0
          },
          'analysis': {
            'analyzer': {
              'fulltext_analyzer': {
                'type': 'standard',
                'stopwords': ['a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde',
                  'en', 'entre', 'hacia', 'hasta', 'para', 'por', 'según', 'segun', 'sin', 'so',
                  'sobre', 'tras', 'durante', 'mediante', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
                  'i', 'j', 'k', 'l', 'm', 'n', 'ñ', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w',
                  'x', 'y', 'z', 'el', 'la', 'los', 'las', 'aquel', 'aquella', 'aquellas', 'aquellos',
                  'esa', 'esas', 'ese', 'esos', 'esta', 'estas', 'este', 'estos', 'mi', 'mis', 'tu',
                  'tus', 'su', 'sus', 'nuestra', 'nuestro', 'nuestras', 'nuestros', 'vuestra',
                  'vuestro', 'vuestras', 'vuestros', 'suya', 'suyo', 'suyas', 'suyos', 'cuanta',
                  'cuánta', 'cuántas', 'cuanto', 'cuánto', 'cuántos', 'que', 'qué', 'alguna',
                  'alguno', 'algunas', 'algunos', 'algun', 'algún', 'bastante', 'bastantes',
                  'cada', 'ninguna', 'ninguno', 'ningunas', 'ningunos', 'ningun', 'ningún',
                  'otra', 'otro', 'otras', 'otros', 'sendas', 'sendos', 'tanta', 'tanto',
                  'tantas', 'tantos', 'toda', 'todo', 'todas', 'todos', 'una', 'uno', 'unas',
                  'unos', 'un', 'varias', 'varios', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                  '0', 'es', 'al', 'sí', 'si', 'no', 'del', 'ti', 'lo', 'se', 'dos', 'va', 'ra',
                  'na', 've', 'da', 'me', 'ven', 'vi', 'av', 'll', 'iv', 'rv', 'ad', 'pa', 'le',
                  'aci', 'au', 'ct', 'lv', 'ha', 'pro', 'rc', 'ido', 'den', 'pt', 'nos', 'tal',
                  'eso', 'era', 'ser', 'más', 'rica', 'or', 'co', 'on', 'ca', 'in', 'to', 'ac',
                  'rd', 'is', 'par', 'it', 'for', 'are', 'be', 'and', 'puede', 'pero', 'cuando',
                  'son', 'como']
              }
            }
          }
        }
      }
    };

    return this.client.indices.create(body);
  }


  /**
   * Deletes an index
   * @param indexName Index name to delete
   */
  public deleteIndex(indexName: string) {
    return this.client.indices.delete({ index: indexName })
      .then()
      .console.error((e) => console.error(e));
  }


  /**
   * Lists all documents from an index
   * @param _index Index to retrieve documents from
   * @param _type Type category inside of index (Currently unused)
   */
  getAllDocuments(_index, _type): any {
    return this.client.search({
      index: _index,
      type: _type,
      body: this.queryalldocs,
      filterPath: ['hits.hits._source'],
      size: 10000
    });
  }




  /**
   * List all terms for a document set inside of an index
   * @param index Index from which retrieve information
   * @param field // TODO: What is this?!?
   * @param ids Documents IDs to retrieve terms from
   */
  getTermsList(index: any, field: any, ids: any): any {

    const params = {
      'ids': ids,
      'termStatistics': true,
      'fields': field,
      'index': index,
      'type': 'doc',
      'offsets': false,
      'positions': false,
      'payloads': false
    };

    return this.client.mtermvectors(params);
  }


  // TODO: What is this?!?!?
  // SUBIDA DE UN DOCUMENTO A UN ÍNDICE
  addToIndex(value): any {
    return this.client.create(value);
  }


  /**
   * Uploads a single document to the Elasticsearch DB
   * @param index Index where to insert the document
   * @param type Type inside of index (Currently unused)
   * @param name Name of the document
   * @param data Data to insert
   * @param id ID for the new document to insert
   */
  public uploadDocument(index, type, name, data, id) {

    const params = {
      'id': id,
      'body': {
        'description': 'Tipo ' + type + ' | ' + name,
        'processors': [
          {
            'attachment': {
              'field': 'data',
              'indexed_chars': '-1',
              // indexed_chars_field : "max_size",
              'properties': ['content', 'title', 'author', 'keywords', 'date', 'content_type', 'content_length', 'language']
            }
          }
        ]
      }
    };
    this.client.ingest.putPipeline(params);

    return this.addToIndex({
      'index': index,
      'type': 'doc',
      'id': id,
      'body': {
        'title': name,
        'data': data
      },
      'pipeline': 'attachment'
    });

  }




  /**
   * Makes a search action using the provided query body
   * @param index Index to search inside
   * @param body Parameters for the search
   */
  public search(index: string, body: any) {
    return this.client.search({
      index: index,
      body: body,
      size: 10000
    });
  }


  /**
   * Checks connection to Elasticsearch server
   */
  conectado(): any {
    return this.client.ping({
      requestTimeout: Infinity,
      body: 'hello'
    });
  }


  // TODO: What is this?!?!?!
  addDoc(info: any): any {
    return this.client.create(info);
  }



  /**
   * Deletes all documents inside an index
   * @param index Index to empty
   */
  deleteAllFromIndex(index: string) {
    return this.client.deleteByQuery({
      index: index,
      body: {
        query: {
          match_all: {}
        }
      }
    });
  }




}


