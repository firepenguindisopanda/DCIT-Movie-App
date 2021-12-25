import { Component, Input, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Comment } from 'src/app/models';

@Component({
  selector: 'app-view-movie-detail',
  templateUrl: './view-movie-detail.component.html',
  styleUrls: ['./view-movie-detail.component.scss']
})
export class ViewMovieDetailComponent implements OnInit {

  comment: Comment = {
    
    username: '',
    text: ''
  };
  comments: any = {};
  userId : number = 0;
  constructor(private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(data => {
      this.userId = data['id'];

    });
  }
  onSubmit(id: number, form: NgForm){
    
    console.log(form);
    
  }
  deleteComment(id: number, movie_id: number): void{
    
  }

}
