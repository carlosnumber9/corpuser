import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ElasticsearchService } from '../elasticsearch.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FileSelectDirective, FileDropDirective, FileUploader } from 'ng2-file-upload/ng2-file-upload';

import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { fadeAnimation } from '../animations';
import { Router, ActivatedRoute } from '@angular/router';
import { debug } from 'util';


declare var $: any;


const URL = 'http://127.0.0.1:8080/fscrawler';
const URL2 = 'http://127.0.0.1:9200/ingest/pipeline';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
  animations: [ fadeAnimation ]
})


export class UploadComponent implements OnInit {

  
  form: FormGroup;
  conexion = false;
  status: string;
  id: number;
  file: File;
  index: string;

  cola: File[];
  ficheros = [];




  changeListener($event) : void {
    this.readThis($event.target);
  }

  readThis(inputValue: any): void {

    this.ficheros = [];


    this.cola = inputValue.files;
    console.log(this.cola);
    var readers: FileReader = new FileReader()[this.cola.length];
      

    for(let fich of this.cola){
      this.extraerContenido(fich);
    }

    console.log(this.ficheros);

  }


  borrarFich(fichero){

    console.log("Se quiere borrar el elemento:");
    console.log(fichero);

    this.ficheros = this.ficheros.filter(function(value){
      return value.data != fichero.data;
    });

    console.log("Fichero borrado de la cola.");
    console.log(this.ficheros);

  }



  async subir(fichero){


    if(fichero.prog < 100){

      fichero.prog = 50;

    await this.elastic.uploadDocument(this.index, fichero.type, fichero.name, fichero.data, this.id)
      .then(res => {
        console.log("Subida de documento realizada con éxito!!");
        fichero.prog = 100;
        this.id = this.id + 1;
        console.log("El siguiente doc para testdocs será el " + this.id);
      }, error => {
        console.log("Hubo un error al subir el documento.");
        console.log(error);
      });


    }
    else {
      console.log("El documento " + fichero.name + " ya se ha subido.");
    }

  }








  





  async procesarSubida(carga) {

    if(carga.constructor === Array){
      for(let elem of this.ficheros) await this.subir(elem);
    }
    else {
      await this.subir(carga);
    }
  }






  extraerContenido(fichero: File) {
    var myReader:FileReader = new FileReader();
    let datos;

    myReader.readAsDataURL(fichero);

    myReader.onloadend = (e) => {

      datos = myReader.result;
      datos = datos.replace("data:" + fichero.type + ";base64,", "");

      this.ficheros.push({
        name: fichero.name,
        type: fichero.type,
        data: datos,
        prog: 0
      });
      
    }
  }






  constructor(
    private http: HttpClient, 
    private fbuilder: FormBuilder, 
    private cd: ChangeDetectorRef, 
    private elastic: ElasticsearchService,
    private route: ActivatedRoute
    ) { 
    this.conexion = false;
    
    this.form = fbuilder.group({
      index: '',
    });
    
    this.id = 1;


  }





  ngOnInit() {

    this.index = this.route.snapshot.params.index;
    console.debug("[UploadComponent]    Se recupera el índice " + this.index + " de la ruta de la aplicación.");


    // CONEXIÓN CON ELASTICSEARCH
    this.elastic.conectado().then(() => {
      this.status = "OK";
      this.conexion = true;
    }, error => {
      this.status = "ERROR";
      this.conexion = false;
      console.error("Elasticsearch no funciona", error);
    }).then(() => {
      this.cd.detectChanges();
    });



     this.actualizarID();

     $("#dropzone")
     .on("dragenter", this.onDragEnter)
     .on("dragover", this.onDragOver)
     .on("dragleave", this.onDragLeave)
     .on("drop", this.onDrop);


  }


  private async actualizarID(){
    this.id = await this.elastic.countDocs('testdocs');
  }





  onSubmit1(value) {


    let cuerpo = {
      index: value.index,
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
    




      this.elastic.createIndex(cuerpo)
        .then(response => {
          console.log("Índice " + value.index + " creado correctamente!");
          console.log(response);
        }, error => {
          console.log("Hubo un error creando el índice" + value.index);
          console.log(error);
        })



  }




  async limpiar(){

    await this.elastic.clearDB(this.index)
      .then(response => {
        console.log(response);
        console.log("Base de datos borrada con éxito.");
      }, error => console.log(error));

    for(let elem of this.ficheros){
      elem.prog = 0;
    }

  }


  onDragEnter(event) {
    event.preventDefault();
    $('#dropzone').css({
      border: '3px solid green',
      transition: 'border 200ms ease-in-out'
    });
    console.log("Entró");
    $('#dropzone').css('border', '3px solid green');
}

onDragOver(event) {
    event.preventDefault(); 
}

onDragLeave(event) {
    event.preventDefault();
    $('#dropzone').css({
      border: '3px solid gray',
      transition: 'border 200ms ease-in-out'
    });
    console.log("Salió");
}

onDrop(event) {
    event.preventDefault();

    let grupo = event.originalEvent.dataTransfer.files;

    console.log(grupo);


    this.ficheros = [];


    this.cola = grupo;
    console.log(this.cola);
    var readers: FileReader = new FileReader()[this.cola.length];
      

    for(let fich of this.cola){
      this.extraerContenido(fich);
    }



  }




}
