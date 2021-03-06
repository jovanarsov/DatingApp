import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { User } from '../_models/user';
import { PresenceService } from './presence.service';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  baseUrl = environment.apiUrl;
  
  //ReplaySubject e tip na Observable, Buffer Object gi smestuva vrednostite vo nego
  //sekoj pat koga nekoj kje se subscribe, kje gi prikaze poslednite vrednosti vo nego
  //ili kolku so ima vo nego, kolku so sakame da pokazime (1)
  private currentUserSource = new ReplaySubject<User>(1); 
  currentUser$ = this.currentUserSource.asObservable();

  constructor(private http: HttpClient, private presence: PresenceService) { }

  login(model: any)
  {
    return this.http.post(this.baseUrl + 'account/login', model).pipe(
      map((response: User) => {
        const user = response;
        if(user)
        {
          this.setCurrentUser(user);
          this.presence.createHubConnection(user);
        }
      })
    )
  }

  register(model: any){
    return this.http.post(this.baseUrl + 'account/register', model).pipe(
      map((user: User) =>{
        if(user){
          this.setCurrentUser(user);
          this.presence.createHubConnection(user);
        }
        //return user; moze tuka da go vratam
        //i kje go prikazam noviot registriran vo register() vo reg.component.ts
      })
    )
  }

  setCurrentUser(user: User){
    user.roles = [];
    const roles = this.getDecodedToken(user.token).role;
    Array.isArray(roles) ? user.roles = roles : user.roles.push(roles);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSource.next(user);
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUserSource.next(null);
    this.presence.stopHubConnection();
  }

  getDecodedToken(token){
    return JSON.parse(atob(token.split('.')[1]));
  }
}
