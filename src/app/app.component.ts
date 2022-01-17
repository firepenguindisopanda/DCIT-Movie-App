import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'Movie-Viewer';
  cardValue: any = {
    options: []
  };

  selectOptions: Array<string> = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'
  ];

  selectChange = (event: any) => {
    const key: string = event.key;
    this.cardValue[key] = [ ...event.data ];

    console.log(this.cardValue);
  };
}
