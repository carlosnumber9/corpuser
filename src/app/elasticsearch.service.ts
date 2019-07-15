import { Injectable, OnChanges } from '@angular/core';

import { Client } from 'elasticsearch-browser';
// import * as elasticsearch from 'elasticsearch-browser';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Document } from './document.model';
import { Index } from './index.model';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';
import { TermVectorsRequest, MultiTermVectorsRequest } from 'elasticsearch-browser';
import { debug } from 'util';


const EP_LOCAL = 'http://localhost:9200';
const EP_AWS = 'https://vpc-corpuserdb-zkvrzlz3tfccm573zw6wnlp2fi.us-east-2.es.amazonaws.com';



@Injectable({
  providedIn: 'root'
})
export class ElasticsearchService {
  

  endpoint = EP_AWS;


  // Variables internas del servicio
  private client: Client;
  private datos;
  queryalldocs = {
    'query': {
      'match_all': {}
    }
  };




private selectedIndex = '';

  public indexSub;


  // CONEXIÓN CON EL SERVIDOR
  constructor() {

    this.selectedIndex = '';

    if (!this.client){ 
      this.connect(); 
    }

    this.indexSub = new BehaviorSubject(this.selectedIndex);

   }


  private connect(){
    this.client = new Client({
      host: this.endpoint
    });
  }


  public getIndex(): string {

    //return of(this.selectedIndex);

    return this.indexSub.getValue();

  }

  public setIndex(index: string) {
    this.selectedIndex = index;
    console.debug("[ElasticsearchService]   selectedIndex = " + this.selectedIndex);
    this.indexSub.next(this.selectedIndex);
  }



  // RECOGIDA DE INFORMACIÓN RELATIVA A ÍNDICES
  indexList(): any {

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



  
  contarDocs(index): number {
    let count = 0;
    this.client.cat.count({
      index: index,
      format: 'json'
    }).then(response => ( count = response[0].count) );
    return count;
  }




  // CREACIÓN DE UN ÍNDICE
  createIndex(index): any {

    let body = {
      index: index,
      body: {
        "mappings": {
          "doc": {
            "properties": {
              "attachment": {
                "properties": {
                  "content": {
                    "type": "text",
                    "term_vector": "with_positions_offsets_payloads",
                    "store": true,
                    "analyzer": "fulltext_analyzer"
                    }
                }
              }
            },
            "_source": {
              "excludes": ["data"]
            }
          }
        },
        "settings": {
          "index": {
            "number_of_shards": 1,
            "number_of_replicas": 0
          },
          "analysis": {
            "analyzer": {
              "fulltext_analyzer": {
                "type": "standard",
                "stopwords": [ "a", "ante", "bajo", "cabe", "con", "contra", "de", "desde", "en", "entre", "hacia", "hasta", "para", "por", "según", "segun", "sin", "so", "sobre", "tras", "durante", "mediante", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "ñ", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "el", "la", "los", "las", "aquel", "aquella", "aquellas", "aquellos", "esa", "esas", "ese", "esos", "esta", "estas", "este", "estos", "mi", "mis", "tu", "tus", "su", "sus", "nuestra", "nuestro", "nuestras", "nuestros", "vuestra", "vuestro", "vuestras", "vuestros", "suya", "suyo", "suyas", "suyos", "cuanta", "cuánta", "cuántas", "cuanto", "cuánto", "cuántos", "que", "qué", "alguna", "alguno", "algunas", "algunos", "algun", "algún", "bastante", "bastantes", "cada", "ninguna", "ninguno", "ningunas", "ningunos", "ningun", "ningún", "otra", "otro", "otras", "otros", "sendas", "sendos", "tanta", "tanto", "tantas", "tantos", "toda", "todo", "todas", "todos", "una", "uno", "unas", "unos", "un", "varias", "varios", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "es", "al", "sí", "si", "no", "del", "ti", "lo", "se", "dos", "va", "ra", "na", "ve", "da", "me", "ven", "vi", "av", "ll", "iv", "rv", "ad", "pa", "le", "aci", "au", "ct", "lv", "ha", "pro", "rc", "ido", "den", "pt", "nos", "tal", "eso", "era", "ser", "más", "rica", "or", "co", "on", "ca", "in", "to", "ac", "rd", "is", "par", "it", "for", "are", "be", "and", "puede", "pero", "cuando", "son", "como"]
                }                       
            }
          }
        }
      }
    }


    return this.client.indices.create(body);
  }





  deleteIndex(index: string) {

    return this.client.indices.delete({index: index})
      .then((response) => (console.debug("[ElasticsearchService]    Índice" + index + " borrado con éxito.")));

  }


  


  // LISTADO DE TODOS LOS DOCUMENTOS DE UN ÍNDICE
  getAllDocuments(_index, _type): any {
    return this.client.search({
      index: _index,
      type: _type,
      body: this.queryalldocs,
      filterPath: ['hits.hits._source'],
      size: 10000
    });
  }






  // LISTADO DE TODOS LOS TÉRMINOS PARA UN CONJUNTO 
  // DE DOCUMENTOS DE UN ÍNDICE
  termVectors(index, field, ids): any {

    let params = {
      ids: ids,
      termStatistics: true,
      fields: field,
      index: index,
      type: "doc",
      offsets: false,
      positions: false,
      payloads: false
    }

    return this.client.mtermvectors(params);
  }



  // SUBIDA DE UN DOCUMENTO A UN ÍNDICE
  addToIndex(value): any {
    return this.client.create(value);
  
  }



  subirDoc(index, type, name, data, id){

    let params = {
      id: id,
      body: {
        description : "Tipo " + type + " | " + name,
        processors : [
        {
          attachment : {
            field : "data",
            indexed_chars : "-1",
            //indexed_chars_field : "max_size",
            properties : [ "content", "title", "author", "keywords", "date", "content_type", "content_length", "language"]
          }
        }
      ]
      }
    }

    this.client.ingest.putPipeline(params);

    return this.addToIndex({
      index: index,
      type: 'doc',
      id: id,
      body: {
        "title": name,
        "data" : data
      },
      pipeline: "attachment"
    });


  }




  // BÚSQUEDA DE INFORMACIÓN ESPECÍFICA DENTRO DE UN ÍNDICE
  busqueda(index, body){

    return this.client.search({
      index: index,
      body: body,
      size: 10000
    });

  }







  



  // COMPROBAR LA CONEXIÓN AL SERVIDOR
  conectado(): any {
    return this.client.ping({
      requestTimeout: Infinity,
      body: "hello"
    });
  }


  addDoc(info): any {
    return this.client.create(info);
  }




  // ELIMINAR LOS DOCUMENTOS DE UN ÍNDICE
  clearDB(index: string) {
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


