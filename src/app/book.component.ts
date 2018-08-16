import { Component, OnInit } from '@angular/core';
import { merge } from 'rxjs';
import {of} from "rxjs/index";
import { map, switchMap,mergeMap, retry } from 'rxjs/operators';

import { HttpErrorResponse } from '@angular/common/http';
import { BookService } from './book.service';
import { Book } from './book';
import {Observable} from "rxjs/index";
import {catchError} from "rxjs/internal/operators/catchError";

@Component({
    selector: 'app-book',
    templateUrl: './book.component.html'
})
export class BookComponent implements OnInit {
    allBooks:Observable<Book[]>;
    favBook:Observable<Book>;
    myAllfavBooks:Observable<Book[]>;
    favBookName:Observable<string>;
    similarBooks:Observable<Book[]>;
    softBooks:Book[];
    allFavBooks:Book[];
    bookName:string | {};
    similarFavBooks:Book[];

    constructor(private bookService:BookService) {
    }

    ngOnInit() {
        this.getBooks();
        this.getFavBook();
        this.getSoftBooks();
        this.getAllFavBooks();
        this.getBookName();
    }

    getBooks() {
        this.allBooks = this.bookService.getBooksFromStore();
    }

    getFavBook() {
        this.favBook = this.bookService.getFavBookFromStore(101);
    }

    getSoftBooks() {
        this.bookService.getBooksFromStore()
            .pipe(retry(3)).subscribe(books => {
                    this.softBooks = books
                },
                (err:HttpErrorResponse) => {
                    if (err.error instanceof Error) {
                        //A client-side or network error occurred.
                        console.log('An error occurred:', err.error.message);
                    } else {
                        //Backend returns unsuccessful response codes such as 404, 500 etc.
                        console.log('Backend returned status code: ', err.status);
                        console.log('Response body:', err.error);
                    }
                }
            );
    }

    getAllFavBooks() {
        this.myAllfavBooks = this.bookService.getFavBookFromStore(101)
            .pipe(mergeMap(book => this.bookService.getBooksByCategoryFromStore(book.category)));

        // Using subscribe
        this.bookService.getFavBookFromStore(101).pipe(mergeMap(book => {
            let category = book.category;
            return this.bookService.getBooksByCategoryFromStore(category);
        })).subscribe(books => {
            this.allFavBooks = books;
        });
    }

    getBookName() {
        this.favBookName = this.bookService.getFavBookFromStore(101).pipe(map(book=> book.name));

        // Using subscribe
        this.bookService.getFavBookFromStore(101)
            .pipe(
                map(book=> {
                    if (book.name.length < 15) {
                        return book.name;
                    } else {
                        throw('Length less than 15');
                    }
                }),
                catchError(error => {
                        console.log(error);
                        throw(error.message || error);
                    }
                ))
            .subscribe(name=> {
                    this.bookName = name;
                    console.log(name);
                },
                err => {
                    console.log(err);
                }
            );
    }

    searchSimilarBooks(id:number) {
        this.similarBooks = this.bookService.getFavBookFromStore(id)
            .pipe(
                switchMap(book => {
                    let category = book.category;
                    return this.bookService.getBooksByCategoryFromStore(category);
                }),
                catchError(err => of([]))
            );

        // Using subscribe
        this.bookService.getFavBookFromStore(id)
            .pipe(
                switchMap(book => {
                    let category = book.category;
                    return this.bookService.getBooksByCategoryFromStore(category);
                }),
                catchError(err => of([]))
            )
            .subscribe(books => {
                this.similarFavBooks = books;
                console.log(books);
            });
    }
}