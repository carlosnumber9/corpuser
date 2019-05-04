/*import { group, animateChild, trigger, animate, transition, style, query } from '@angular/animations';

export const fadeAnimation =
  trigger('fadeAnimation', [
    transition('* => *', [
      style({ position: 'relative' }),
      query(':enter, :leave', [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%'
        })
      ], {optional: true}),
      query(':enter', [
        style({ left: '-100%'})
      ], {optional: true}),
      query(':leave', animateChild(), {optional: true}),
      group([
        query(':leave', [
          animate('1000ms ease-out', style({ left: '100%'}))
        ], {optional: true}),
        query(':enter', [
          animate('1000ms ease-out', style({ left: '0%'}))
        ], {optional: true})
      ]),
      query(':enter', animateChild(), {optional: true}),
    ]),
    transition('* <=> *', [
      style({ position: 'relative' }),
      query(':enter, :leave', [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%'
        })
      ]),
      query(':enter', [
        style({ left: '-100%'})
      ], {optional: true}),
      query(':leave', animateChild()),
      group([
        query(':leave', [
          animate('200ms ease-out', style({ left: '100%'}))
        ]),
        query(':enter', [
          animate('300ms ease-out', style({ left: '0%'}))
        ])
      ]),
      query(':enter', animateChild()),
    ])
  ]);*/


  import { trigger, animate, transition, style, query } from '@angular/animations';

  export const fadeAnimation =
  
      trigger('fadeAnimation', [
  
          transition( '* => *', [
  
              query(':enter', 
                  [
                      style({ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        opacity: 0 })
                  ], 
                  { optional: true }
              ),
  
              query(':leave', 
                  [
                      style({ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        opacity: 1 }),
                      animate('0.2s', style({ opacity: 0 }))
                  ], 
                  { optional: true }
              ),
  
              query(':enter', 
                  [
                      style({ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        opacity: 0 }),
                      animate('0.2s', style({ opacity: 1 }))
                  ], 
                  { optional: true }
              )
  
          ])
  
      ]);