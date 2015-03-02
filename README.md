Web based Minecraft programming
===============================

Minecraft has an API that allows you to program it. This API is simple, but with a few simple
API calls, you can create some amazing creations, games, visualisations, anything you can imagine.

Most people learn Python in order to program minecraft, but you can program Minecraft in any language.
Why should you have to learn Python to code minecraft?

I have discovered from running a number of careers evenings at schools, that a common answer to the
question "have you done any programming before" is often "yes, I've done some web pages, a bit of HTML
and a tiny bit of javascript and css". I was also asked by some school teachers whether it was possible 
to program Minecraft in javascript, as many children already learn a bit of javascript in ICT classes.

I looked around, and there are a couple of solutions already to program Minecraft in Javascript,
but they seemed to me a bit fiddly to set up. What I was looking for was something that was easy
to just copy a couple of files onto your computer, and get coding with it really quickly.

With the Raspberry Pi 3rd Birthday coming up, I wanted to try something a little new. On Sunday 1st March 2015,
I showed an early prototype of this idea to an audience at Cambridge Labs, and the feedback was so good that
it seems worthwhile developing this idea further.


So what does it do?
===================

Not a lot at the moment! I have written a sample web page in HTML that allows you to enter Javascript programs
inside a text box. Inside this text box you can type code, or you can (as I did for simpicity of a demo in
a live auditorium) add some buttons that pasted code into the text box. When I pressed the BUILD button on
the web form, somethign appeared inside Minecraft!

At the moment I have written a setBlock() and a setBlocks() implementation - that's all at the moment! But
with this you can write javascript code inside a web page, and get that code to build constructions
inside a running Minecraft game. With it, at my demo, I showed building a Minecraft dice, a tower of blocks
50 blocks high, and some houses of different sizes.

The (minimal) API at the moment is this:

mc = Builder()

mc.postToChat("hello")

mc.setBlock(x,y,z, blockId)

mc.setAllBlocks(x1,y1,z1, x2,y2,z2, blockId)

mc.doit()


On your web page, put this at the top:
&lt;script src="MinecraftBuilder.js"&gt;&lt;/script&gt;

Somewhere in side a &lt;script&gt; tag, write some code

function buildSomething()

{

  mc = Builder()

  mc.postToChat("hello")

  mc.setBlock(0,0,0, mc.STONE)

  mc.setAllBlocks(0,0,0, 10, 10, 10, block.MELON)

  mc.doit()

}

Somewhere on a form, add a button, and call your code

&lt;input type="button" value="build" onClick="buildSomething()"&gt;

On your Raspberry Pi (or your PC or mac) run the following script (Python 2 only tested at present)
making sure that Minecraft is running (if on PC/Mac, make sure your server and RaspberryJuice are
also running).

python webmcpi.py

How does it work?
=================

There is a small python program that runs on your Raspberry Pi, PC or Mac. This is a tiny web server
that receives commands, and passes those commands over to the Minecraft Pi (mcpi) API. The demo I gave
was running on my Mac, but this *should* work on any platform.

Inside a web browser you run a single HTML file, and this includes a single .js javascript file that has
all the clever stuff inside it.


What more could you do with it?
===============================

Because you can now build web pages and link them to Minecraft via Javascript, it gives you the ability
to build a web form to collect together all your useful scripts. For example, with my house builder script,
you could add a text box to allow the user to choose the size of the house, and a drop down box for them
to choose what block types to build the house from. Perhaps you could even add some radio buttons to
choose the number of windows, and a checkbox to choose whether to build a chimney or not. Or any
other idea that you can imagine. 

If you already know a tiny bit of web programming, why not use what you already know to customise
your favorite game? It's up to you what you build with it!


What can't it do at the moment?
===============================

There's a lot that it can't do, and to understand this properly, please see the TODO list below
to understand the limitations further. Basically I have only written setBlock() and setAllBlocks()
at the moment. setBlock() sets a single block at a coordinate relative to the player position,
and setAlLBlocks sets all blocks at a range of coordinates to the same values.

You can use loops and variables in your javascript programs, but your programs must be
"terminating" - this means they must eventually end. You can't (yet) write programs that
build mini games with a game loop.

One of the biggest challenges with javascript and web programming, is that the web is
"asynchronous" - this means that you ask a website to do something, then you wait until
it tells you that it has done it. Instead of waiting in a loop, your web page gets on
with other stuff. Modern web browsers require your javascript to be written as an
"event driven program", which means that when you press a button on a form, it should do
something small, and then return back quite quickly. If you don't do this, the browser
will stop responding (and some browsers will pop up a message saying 'this script has
become non-responsive, do you want to wait or stop it').

I have a bigger set of plans to allow interactive mini-game programming in future releases,
but because interest in this idea was overwhelming, I wanted to release something simple
as quick as possible, and perhaps others can help me along the way to suggest and add
new features.


TODO list
=========

* upload the code to github!
* write a user guide for what we have working today
* replace my test web server with a more robust one, based on the standard python libraries
* add setBlocks()
* add getTilePos()
* add setTilePos()
* add getHeight()
* add getBlock()
* add getBlocks()
* introduce server variables, so it's possible to do things like object teleporters with
  getBlocks() and setBlocks()
* lots of other stuff

David Whale
@whaleygeek


