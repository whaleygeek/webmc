# webmcpi.py     (c) 2015 @whaleygeek
# web_server.py  (c) 2013-2015 @whaleygeek
#
# A very simple single-threaded web server that accepts JSON requests
# containing commands for Minecraft. These commands are then sent to the mcpi
# MinecraftPi API, so that things can be built inside Minecraft.
#
# This is a demo program only.
# The intention is to completely rework this web server in the future
# but it serves a useful purpose at the moment for showing off an idea.


import network
import time
import urllib
import json

# Note, at least python 2.6 is required for this.
try:
  import urlparse as urlparse # python2
except ImportError:
  # Not tested on python 3 yet
  import urllib.urlparse as urlparse # python3

def trace(msg):
  print("webmcpi:" + str(msg))


# WEB SERVER -------------------------------------------------------------------

PORT          = 8080
state         = 0
request       = None
method        = None
url           = None
version       = None
contentLength = None


def handleRequest(line):
  global request, method, url, version
  #trace("request:" + line)
  parts = line.split(" ", 3)
  if len(parts) != 3:
    network.say("HTTP/1.0 400 Request error")
    network.say("")
    return False # Not done

  # decode the request line
  #TODO this is repeated in the webapp, this is the correct one
  parts = line.split(" ", 2)
  method = parts[0]
  url = parts[1]
  version = parts[2]
  #trace("method:" + method)
  #trace("url:" + url)
  #trace("version:" + version)
  
  request = line
  return True # Done


def handleHeader(line):
  global contentLength

  #trace("header:" + line)
  parts = line.split(":", 1)
  key = parts[0]
  if len(parts) > 1:
    value = parts[1]
  else:
    value = None

  # grab any headers we're interested in
  if key == "Content-Length":
    contentLength = int(value) # TODO what if not int, get exception
    #trace("content length is:" + str(contentLength))

  return True # Done


def sendStatusResponse(): # TODO status parameter
  global network, response
  network.say(version + " 200 OK") # response


def sendGetHeaders():
  network.say("") # No headers


def sendGetBody(body):
  network.say(body)


def sendPostHeaders():
  network.say("Content-Type: text/plain") # TODO DUMMY
  network.say("Content-Length: " + str(contentLength))
  network.say("") 


def sendPostBody(body):
  network.say(body)


STATE_REQ_METHOD = 0
STATE_REQ_HEADERS = 1
STATE_REQ_POSTBODY = 2

def heard(line):
  # This is the HTTP request handling state machine

  global state
  global network
  global method
  global request
  global contentLength
  global requestBody
  
  #trace("heard:" + line)

  #----------------------------------------------------------------------
  if state == STATE_REQ_METHOD: # {method} {url} {HTTP/ver.ver}
    #trace("handle METHOD")
    ok = handleRequest(line)
    if not ok:
      network.hangUp()
      state = STATE_REQ_METHOD
    else:
      method = (line.split(" "))[0]
      #trace("method:" + method)
      state = STATE_REQ_HEADERS
    
    
  #----------------------------------------------------------------------
  elif state == STATE_REQ_HEADERS:
    #trace("handle HEADERS")
    if len(line.strip()) != 0: # not blank separator
      # process a header
      ok = handleHeader(line)
      if not ok:
        network.hangUp()
        state = STATE_REQ_METHOD

    else:
      # process blank line header separator
      if method == "GET":
        responseBody = processGET(request)
        sendStatusResponse()
        sendGetHeaders()
        sendGetBody(responseBody)

        network.hangUp() # done
        state = STATE_REQ_METHOD

      elif method == "POST":
        if contentLength != None and contentLength == 0: # no request body
          #trace("no postreq body")
          handlePostResponse("OK")
          state = STATE_REQ_METHOD
        else:
          #trace("expecting postreq body")
          requestBody = None
          contentLength -= 1 #temporary, don't count extra newline
          state = STATE_REQ_POSTBODY

      else: # unhandled method
        #trace("unhandled method:" + method)
        network.hangUp()
        state = STATE_REQ_METHOD

  #----------------------------------------------------------------------
  elif state == STATE_REQ_POSTBODY:
    # keep processing lines until contentLength achieved.
    #trace("postReqBody:" + line)
    if requestBody == None:
      requestBody = line
    else:
      requestBody = requestBody + "\n" + line

    contentLength -= (len(line) + 1) # extra one for each newline
    #trace("expecting remaining chars:" + str(contentLength))
    
    if contentLength <= 0:
      processPOSTBody(url, requestBody)
      handlePostResponse("OK")
      state = STATE_REQ_METHOD


def handlePostResponse(body):
  sendStatusResponse()
  contentLength = len(body)
  sendPostHeaders()
  sendPostBody(body)
  network.hangUp()


# MCPI WEB APP ----------------------------------------------------------------

def processPOSTBody(url, body):
  #trace("POST url:" + url)
  #trace("POST body:" + body)
  data = json.loads(body)

  commands = data["commands"]
  #trace(commands)
  for cmd in commands:
    actionCommand(cmd)


def actionCommand(cmd):
  #trace(str(cmd))
  id = cmd["id"]
  if id == "SETALLBLOCKS":
    doSetAllBlocks(cmd)
  elif id == "SETBLOCK":
    doSetBlock(cmd)
  else:
    trace("Unhandled command:" + str(cmd))


def doPostToChat(msg):
  mc.postToChat(msg)
  #trace("chat:" + msg)


def doSetBlock(cmd):
  pos = mc.player.getTilePos()

  # Relative to player position, at the moment
  x = int(cmd["x"]) + pos.x+1
  y = int(cmd["y"]) + pos.y
  z = int(cmd["z"]) + pos.z
  blockId = int(cmd["blockId"])
  mc.setBlock(x,y,z, blockId)


def doSetAllBlocks(cmd):
  pos = mc.player.getTilePos()

  # Relative to player position, at the moment
  x1 = int(cmd["x1"]) + pos.x+1
  y1 = int(cmd["y1"]) + pos.y
  z1 = int(cmd["z1"]) + pos.z
  x2 = int(cmd["x2"]) + pos.x+1
  y2 = int(cmd["y2"]) + pos.y
  z2 = int(cmd["z2"]) + pos.z
  blockId = int(cmd["blockId"])

  #trace("mc.setBlocks(" + str(x1) + "," + str(y1) + "," + str(z1) + ","
  #  + str(x2) + "," + str(y2) + "," + str(z2) + "," + str(blockId) + ")")

  mc.setBlocks(x1,y1,z1,x2,y2,z2,blockId)


def doGetTilePos():
  #pos = mc.getTilePos()
  #p = (pos.x, pos.y, pos.z)
  p = (1, 2, 3)
  trace("getTilePos:" + str(p))
  return str(p)



def processGET(url):
  # This is an old (DEPRECATED) GET version of the API
  trace("processing:" + str(line))

  # split the URL into path and querystring
  components = urlparse.urlparse(url)
  path = components.path
  query = components.query
  trace("path:" + path)
  trace("query:" + str(query))

  # See if it is the /mcpi/ prefix
  #TODO do this in the web server registration
  if not path.startswith("/mcpi/"):
    trace("ignoring unknown path:" + path)
    return "IGNORED"

  # strip off the registered part of the path
  #TODO do this in the web server registration dispatcher
  path = path[6:]


  # Parse the query string into component parts
  #TODO do this in the web server
  q = urlparse.parse_qs(query)
  trace("q:" + str(q))


  #TODO: WEBAPP handler starts here
  # dispatch to handler based on path part
  if path == "postToChat":
    msg    = (q["msg"])[0]
    result = doPostToChat(msg)

  elif path == "player_getTilePos":
    result = doPlayerGetTilePos()
  
  else:
    result = "Unknown path:" + str(path)
    # TODO return an error object??

  return result


# MAIN PROGRAM -----------------------------------------------------------------------

import mcpi.minecraft as minecraft
mc = minecraft.Minecraft.create()
mc.postToChat("web server running")

while True:  
  trace("waiting for connection on port:" + str(PORT))
  network.wait(port=PORT, whenHearCall=heard)
  trace("connected")

  while network.isConnected():
    # Nothing else to do, but could run other code here
    time.sleep(1)

  trace("disconnected")

# END OF PROGRAM





