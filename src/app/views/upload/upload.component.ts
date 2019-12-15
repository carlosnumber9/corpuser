import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ElasticsearchService } from '../../elasticsearch.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { fadeAnimation } from '../../animations';
import { ActivatedRoute } from '@angular/router';

declare var $: any;

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
  animations: [fadeAnimation]
})

export class UploadComponent implements OnInit {

  form: FormGroup;
  conexion = false;
  status: string;
  id: number;
  file: File;

  // Selected index inside the index list
  private selectedIndex: string;

  // List of imported ray File objects
  private importedFiles: File[];

  // List of processed objects with file data
  private fileQueue = [];




  changeListener($event): void {
    this.readThis($event.target);
  }

  readThis(inputValue: any): void {

    this.fileQueue = [];

    this.importedFiles = inputValue.files;

    for (let fich of this.importedFiles) {
      this.extractContent(fich);
    }
  }

  /**
   * Deletes a file from the file queue
   * @param fileToDelete file object to delete
   */
  deleteFile(fileToDelete: any) {

    this.fileQueue = this.fileQueue.filter(function (file) {
      return file.data != fileToDelete.data;
    });

  }


  /**
   * Uploads a single file of the file queue
   * @param fileToUpload file to insert into the index
   */
  private async upload(fileToUpload: any) {

    if (fileToUpload.prog < 100) {

      fileToUpload.prog = 50;

      await this.elastic.uploadDocument(this.selectedIndex, fileToUpload.type, fileToUpload.name, fileToUpload.data, this.id)
        .then((res: Response) => {
          fileToUpload.prog = 100;
          this.id = this.id + 1;
        }, (error: Error) => {
          console.log(error);
        });

    }

  }


  /**
   * Runs the uploading process for all files in file queue
   * @param filesToProcess Can be a list of files or a unique file
   */
  private async processUploading(filesToProcess: any) {

    if (filesToProcess.constructor === Array) {
      for (let fileToUpload of this.fileQueue) {
        await this.upload(fileToUpload);
      }
    }
    else {
      await this.upload(filesToProcess);
    }

  }





  /**
   * Retrieves key fields of a file and stores it in files
   * @param file File object to extract data from
   */
  extractContent(file: File) {
    var myReader: FileReader = new FileReader();
    let datos;

    myReader.readAsDataURL(file);

    myReader.onloadend = () => {

      datos = myReader.result;
      datos = datos.replace("data:" + file.type + ";base64,", "");

      this.fileQueue.push({
        name: file.name,
        type: file.type,
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

    this.selectedIndex = this.route.snapshot.params.index;

    // ElasticSearch connection check
    this.elastic.conectado().then(() => {
      this.status = "OK";
      this.conexion = true;
    }, error => {
      this.status = "ERROR";
      this.conexion = false;
      console.error(error);
    }).then(() => {
      this.cd.detectChanges();
    });

    this.refreshIdValue();

    $("#dropzone")
      .on("dragenter", this.onDragEnter)
      .on("dragover", this.onDragOver)
      .on("dragleave", this.onDragLeave)
      .on("drop", this.onDrop);

  }


  /**
   * Searchs for the last ID used into the index 
   */
  private async refreshIdValue() {
    this.id = this.elastic.countDocs('testdocs');
  }




  /**
   * Removes all documents from the currently selected index
   */
  private async cleanIndex() {

    await this.elastic.deleteAllFromIndex(this.selectedIndex)
      .then(response => {
        console.log(response);
        console.log("Base de datos borrada con éxito.");
      }, error => console.log(error));

    for (let elem of this.fileQueue) {
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

    this.fileQueue = [];
    this.importedFiles = grupo;

    for (let fich of this.importedFiles) {
      this.extractContent(fich);
    }
  }

}
