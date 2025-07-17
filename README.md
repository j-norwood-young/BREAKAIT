# BREAKAIT

This Breakout clone is a quick experiment with using AI to code. I started with Gemini CLI, which did a great job at zero-shotting it, but when I started to make changes I quickly ran out of tokens. I used Cursor to pick up where Gemini left off. It took me about an hour I guess. I particularly love the sounds!

It might be fun to train an AI how to play it :)

[Play it HERE](https://j-norwood-young.github.io/BREAKAIT/)

## Original Prompt

Here's the first prompt I gave to Gemini CLI:

```
Create me a JS game like Breakout. Our mouse or arrow keys controls a rectangluar cursor at the bottom of the screen, and we bounce a ball to hit bricks which break the bricks. Some bricks need more hits, and are coloured to show this. We need to position our cursor to return the ball, and the side of the rectangle we hit with controls the degree of the return. The ball respects physics in terms of bouncing and object detection. When we start, the ball is stuck to the cursor, and we click or hit space to start. We just need one level. It must have mouse control, an 80s Atari vibe, and a start and end screen. We should get 5 lives per game. We should be able to collect special dropdowns like fire control, sticky ball, extra ball, and slow down. These effects can stack. There are also negative dropdowns - speedup, clear good benefits.
```

The only major bug was that the lives counter was misaligned off the screen, but fixing that took up most of my free tokens. 

After that I worked on some gameplay, start and end states, and the little animation for when a block is destroyed. It just managed this, and then ran out of tokens in a broken state, which was annoying.

Fortunately, I opened up Cursor, gave it the error, and it fixed it. Cursor (with the help of Claude) finished off some visuals and added the cool sounds.

It's all 100% Javascript, no libraries. If I think how long this would have taken me, it's crazy how fast it popped it out. 

## HOWEVER...

I would not have minded if it had used some libraries, created more files for different features of the game, and generally structured the code to make it more maintainable. It also added no documentation apart from a few sparse comments - I'm finding that Cursor is getting very good at writing Readmes for everything. (Sometimes it's a little too enthusiastic!) I didn't put that in the prompt because I wanted to see what it would do. 

## Next steps

It's really basic and there are a ton of issues, not least of which is having only one level. But I think it's playable enough that it'd be fun to see if I can teach an AI to play the game. In the meantime, I LOVE Breakout. 