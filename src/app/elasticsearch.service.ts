import { Injectable } from '@angular/core';

import { Client } from 'elasticsearch-browser';
//import * as elasticsearch from 'elasticsearch-browser';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Document } from './document.model';
import { Index } from './index.model';
import { Observable, of } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';
import { TermVectorsRequest, MultiTermVectorsRequest } from 'elasticsearch-browser';

const EPElastic = "http://localhost:9200";
const EPFSCrawler = "http://localhost:8080/fscrawler";
const EPUpload = "http://localhost:4200/api/uploads";

@Injectable({
  providedIn: 'root'
})
export class ElasticsearchService {

  private client: Client;
  private datos;
  queryalldocs = {
    'query': {
      'match_all': {}
    }
  };

  constructor(private http: HttpClient) {
    if (!this.client){ this.connect(); }
   }


  private connect(){
    this.client = new Client({
      host: 'http://localhost:9200'
    });
  }


  indexList(){
    return this.client.cat.indices({
      format: 'json'
    });
  }





  createIndex(name): any {
    return this.client.indices.create(name);
  }


  addToIndex(value): any {
    return this.client.create(value);
  
  }


  getAllDocuments(_index, _type): any {
    return this.client.search({
      index: _index,
      type: _type,
      body: this.queryalldocs,
      filterPath: ['hits.hits._source'],
      size: 10000
    });
  }






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



  


  busqueda(index, body){

    return this.client.search({
      index: index,
      body: body,
      size: 10000
    });

  }






  contarDocs(index: string) {
    return this.client.cat.count({
      format: 'json'
    });
  }














/*

  subirDoc(documento: File): Observable<Object>{
    console.log("Se va a subir el documento " + documento.name);




    const opciones = {
      headers: new HttpHeaders({
        'Content-Type' : documento.type
      })
    }
    const fd = new FormData();
    fd.append('pdf', documento, documento.name);
  



    return this.http.post(EPFSCrawler + "/_upload", fd, opciones)
      .pipe(
        catchError(error => of("Hola" + error))
      );
  }

  */

  conectado(): any {
    return this.client.ping({
      requestTimeout: Infinity,
      body: "hello"
    });
  }


  addDoc(info): any {
    return this.client.create(info);
  }



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


