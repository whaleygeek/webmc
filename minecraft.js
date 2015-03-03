/* MinecraftBuilder.js  25/02/2015  D.J.Whale
 *
 * An object that can be used to build blocks inside minecraft.
 *
 * Constructs a list of build instructions from calls to these methods,
 * when doit() is called, sends a large concatenated payload of instructions
 * to a server (python script via HTTP), that follows those instructions.
 *
 * Written this way, so we can teach javascript in a web context using Minecraft,
 * but without getting into callback hell. 
 *
 * There are limitations, you can't write game loops or anything that makes decisions
 * based on the state of the Minecraft world. But it is useful for automating
 * the building of large structures, and building utility websites to drive Minecraft
 * construction.
 * 
 * Because all instructions are executed as a single list, any return types from
 * functions are not the actual value, but a reference to a server variable that
 * will hold that value at runtime. You can't inspect the state of these variables,
 * but you can use them in other Builder calls, and the build script that is created
 * will do the right thing, based on the present value of that server variable at
 * that point in the script.
 */


/* a ServerVarRef will be a unique number. Every time you create a new one, it will
 * increment the number, so that variables are uniquely numbered. This is at build
 * script creation time. Any references to varabiles are put into the generated list
 * of commands at the point they are created, and at the point they are used.
 *
 * when doit() is run, the whole generated script is uploaded to the server and
 * executed as a list of instructions, a bit like microcode. When a new variable
 * is created, it is created on the server as that number. When a reference to
 * a variable is used in an instruction, the present value of the server variable
 * is consulted at that time.
 *
 * This works fine for non-interactive build processes.
 */

//TODO put the whole module in a namespace to protect names


function trace(msg)
{
  console.log("builder:" + msg)
}

function pos(x,y,z)
{
  return "(" + x + "," + y + "," + z + ")"
}


function quoted(s) 
{
  if (s == undefined)
  {
    return "null"
  }
  return "\"" + s + "\""
}


function kvp(k,v)
{
  return quoted(k) + ":" + quoted(v)
}


function Command(id)
{
  this.id = id
}

Command.prototype =
{
  GETBLOCK:      "GETBLOCK",
  GETBLOCKDATA:  "GETBLOCKDATA",
  GETBLOCKS:     "GETBLOCKS",
  SETBLOCK:      "SETBLOCK",
  SETBLOCKDATA:  "SETBLOCKDATA",
  SETBLOCKS:     "SETBLOCKS",
  SETALLBLOCKS:  "SETALLBLOCKS",
  GETHEIGHT:     "GETHEIGHT",

  type:   "Command",
  public: ["id"],

  getId: function()
  {
    return this.id
  },

  asJson: function()
  {
    result = "{"
    result += kvp("type", this.type)
    for (i in this.public)
    {
      result += ","
      k = this.public[i]
      result += kvp(k, this[k]) 
    }
    result += "}"
    return result
  }
}


function GetBlockCommand(x,y,z)
{
  this.x = x
  this.y = y
  this.z = z
}

GetBlockCommand.prototype = 
{
  __proto__:   Command.prototype,
  type:        "GetBlockCommand",
  id:          Command.prototype.GETBLOCK,
  public:      ["id", "x", "y", "z"],
}


function GetBlockDataCommand(x,y,z)
{
  this.x = x
  this.y = y
  this.z = z
}

GetBlockDataCommand.prototype = 
{
  __proto__:   Command.prototype,
  type:        "GetBlockDataCommand",
  id:          Command.prototype.GETBLOCKDATA,
  public:      ["id", "x", "y", "z"],
}


function GetBlocksCommand(x1, y1, z1, x2, y2, z2)
{
  this.x1 = x1
  this.y1 = y1
  this.z1 = z1
  this.x2 = x2
  this.y2 = y2
  this.z2 = z2
}

GetBlocksCommand.prototype = 
{
  __proto__:   Command.prototype,
  type:        "GetBlocksCommand",
  id:          Command.prototype.GETBLOCKS,
  public:      ["id", "x1", "y1", "z1", "x2", "y2", "z2"],
}


function SetBlockCommand(x,y,z, blockId)
{
  this.x = x
  this.y = y
  this.z = z
  this.blockId = blockId
}

SetBlockCommand.prototype = 
{
  __proto__:   Command.prototype,
  type:        "SetBlockCommand",
  id:          Command.prototype.SETBLOCK,
  public:      ["id", "x", "y", "z", "blockId"],
}


function SetBlockDataCommand(x,y,z, blockData)
{
  this.x = x
  this.y = y
  this.z = z
  this.blockData = blockData
}

SetBlockDataCommand.prototype = 
{
  __proto__:   Command.prototype,
  type:        "SetBlockDataCommand",
  id:          Command.prototype.SETBLOCKDATA,
  public:      ["id", "x", "y", "z", "blockData"],
}


function SetBlocksCommand(x1, y1, z1, x2, y2, z2, blocks)
{
  this.x1 = x1
  this.y1 = y1
  this.z1 = z1
  this.x2 = x2
  this.y2 = y2
  this.z2 = z2
  this.blocks = blocks
}

SetBlocksCommand.prototype = 
{
  __proto__:   Command.prototype,
  type:        "SetBlocksCommand",
  id:          Command.prototype.SETBLOCKS,
  public:      ["id", "x1", "y1", "z1", "x2", "y2", "z2", "blocks"],
}


function SetAllBlocksCommand(x1, y1, z1, x2, y2, z2, blockId)
{
  this.x1 = x1
  this.y1 = y1
  this.z1 = z1
  this.x2 = x2
  this.y2 = y2
  this.z2 = z2
  this.blockId = blockId
}

SetAllBlocksCommand.prototype = 
{
  __proto__:   Command.prototype,
  type:        "SetAllBlocksCommand",
  id:          Command.prototype.SETALLBLOCKS,
  public:      ["id", "x1", "y1", "z1", "x2", "y2", "z2", "blockId"],
}


function GetHeightCommand(x, z)
{
  this.x = x
  this.z = z
}


GetHeightCommand.prototype = 
{
  __proto__:   Command.prototype,
  type:        "GetHeightCommand",
  id:          Command.prototype.GETHEIGHT,
  public:      ["id", "x", "z"],
}




//TODO need a ServerVar class



//TODO ServerVar class, singleton parent that manages unique instance numbers
//these numbers then go into the json that is passed to the server for both
//set and get operations that use server variables.

function Builder()
{
    //trace("constructor")
    // constructor
    // in memory representation only, builds command lists.
    // the root of all Builder objects.
    this.commands = []
}


Builder.prototype =
{
  AIR                 : 0,
  STONE               : 1,
  GRASS               : 2,
  DIRT                : 3,
  COBBLESTONE         : 4,
  WOOD_PLANKS         : 5,
  SAPLING             : 6,
  BEDROCK             : 7,
  WATER_FLOWING       : 8,
  WATER               : 8,
  WATER_STATIONARY    : 9,
  LAVA_FLOWING        : 10,
  LAVA                : 10,
  LAVA_STATIONARY     : 11,
  SAND                : 12,
  GRAVEL              : 13,
  GOLD_ORE            : 14,
  IRON_ORE            : 15,
  COAL_ORE            : 16,
  WOOD                : 17,
  LEAVES              : 18,
  GLASS               : 20,
  LAPIS_LAZULI_ORE    : 21,
  LAPIS_LAZULI_BLOCK  : 22,
  SANDSTONE           : 24,
  BED                 : 26,
  COBWEB              : 30,
  GRASS_TALL          : 31,
  WOOL                : 35,
  FLOWER_YELLOW       : 37,
  FLOWER_CYAN         : 38,
  MUSHROOM_BROWN      : 39,
  MUSHROOM_RED        : 40,
  GOLD_BLOCK          : 41,
  IRON_BLOCK          : 42,
  STONE_SLAB_DOUBLE   : 43,
  STONE_SLAB          : 44,
  BRICK_BLOCK         : 45,
  TNT                 : 46,
  BOOKSHELF           : 47,
  MOSS_STONE          : 48,
  OBSIDIAN            : 49,
  TORCH               : 50,
  FIRE                : 51,
  STAIRS_WOOD         : 53,
  CHEST               : 54,
  DIAMOND_ORE         : 56,
  DIAMOND_BLOCK       : 57,
  CRAFTING_TABLE      : 58,
  FARMLAND            : 60,
  FURNACE_INACTIVE    : 61,
  FURNACE_ACTIVE      : 62,
  DOOR_WOOD           : 64,
  LADDER              : 65,
  STAIRS_COBBLESTONE  : 67,
  DOOR_IRON           : 71,
  REDSTONE_ORE        : 73,
  SNOW                : 78,
  ICE                 : 79,
  SNOW_BLOCK          : 80,
  CACTUS              : 81,
  CLAY                : 82,
  SUGAR_CANE          : 83,
  FENCE               : 85,
  GLOWSTONE_BLOCK     : 89,
  BEDROCK_INVISIBLE   : 95,
  STONE_BRICK         : 98,
  GLASS_PANE          : 102,
  MELON               : 103,
  FENCE_GATE          : 107,
  GLOWING_OBSIDIAN    : 246,
  NETHER_REACTOR_CORE : 247,


  getBlock: function(x, y, z)
  {
    //trace("getBlock:" + x + "," + y + "," + z)
    this.commands.push(new GetBlockCommand(x,y,z))
    // returns ServerVarRef(blockId)
  },

  getBlockData: function(x, y, z)
  {
    //trace("getBlockData:" + x + "," + y + "," + z)
    this.commands.push(new GetBlockDataCommand(x,y,z))
    // returns ServerVarRef(blockData)
  },

  getBlocks: function(x1, y1, z1, x2, y2, z2)
  {
    //trace("getBlocks:" + x1 + "," + y1 + "," + z1 + "->" + x2 + "," + y2 + "," + z2)
    this.commands.push(new GetBlocksCommand(x1,y1,z1,x2,y2,z2))
    // returns ServerVarRef(blocks)
  },

  setBlock: function(x, y, z, blockId)
  {
    //trace("setBlock:" + x + "," + y + "," + z + " = " + blockId)
    this.commands.push(new SetBlockCommand(x,y,z, blockId))
    // blockId can be: integer block id
    // can also be a ServerVarRef()
    // no return
  },

  setBlockData: function(x, y, z, data)
  {
    //trace("setBlockData:" + x + "," + y + "," + z + " = " + data)
    this.commands.push(new SetBlockDataCommand(x,y,z, data))
    // data can be extraData
    // can also be a ServerVarRef()
    // no return
  },

  setBlocks: function(x, y, z, blocks)
  {
    //trace("setBlocks:" + x + "," + y + "," + z + " = " + blocks)
    this.commands.push(new SetBlocksCommand(x,y,z, blocks))
    // blocks is a ServerVarRef() size(xd, yd, zd) and blockId and extraData of all blocks
    // no return
  },

  setAllBlocks: function(x1, y1, z1, x2, y2, z2, blockId)
  {
    //trace("setAllBlocks:" + x1 + "," + y1 + "," + z1 + "->" + x2 + "," + y2 + "," + z2 + "=" +  blockId)
    this.commands.push(new SetAllBlocksCommand(x1,y1,z1,x2,y2,z2, blockId))
    // blockId can be a block integer
    // can also be a ServerVarRef()
    // no return
  },

  getHeight: function(x, z)
  {
    //trace("getHeight:" + x + "," + z)
    this.commands.push(new GetHeightCommand(x,z))
    // returns ServerVarRef(world height at x,z)
  },

  buildJSON: function()
  {
    json = "{\"commands\":["
    first = true
    for (i in this.commands)
    {
      if (! first)
      {
        json += ","
      }
      cmd = this.commands[i]
      json += cmd.asJson()
      first = false
    }
    json += "]}"
    return json
  },

  doit: function()
  {
    //trace("doit")
    //console.log(this.commands)
    json = this.buildJSON()
    this.commands = []
    p = new Poster()
    p.post("http://localhost:8080/mcpi/testPost", json, 
      function(data, seq)
      {
        //TODO: mucky!
        //document.getElementById("output").innerHTML = data
      }
    )
  }
}

function MinecraftBuilder(serverUrl, callback)
{
  this.serverUrl = serverUrl
  this.callback  = callback
}


MinecraftBuilder.prototype =
{
  __proto__: MinecraftBuilder,

  doit: function()
  {
    p = new Poster()
    p.post("http://localhost:8080/mcpi/testPost", json, 
      function(data, seq)
      {
        if (callback != null)
        {
          callback(data)
        }
        //TODO: mucky!
        //document.getElementById("output").innerHTML = data
      }
    )
  }
}


//TODO
//function MinecraftBuilder(serverUrl)
//{
  // constructor, relative to spawn point
//}

//function MinecraftBuilderAt(serverUrl, x, y, z)
//{
  // constructor, at a specific location
//}

//function MinecraftBuilderFromPlayer(serverUrl, xd, yd, zd)
//{
  // constructor, relative to player location
//}






function teleport_object(mc, x,y,z, xs, ys, zs, xn, yn, zn)
{
  obj = cut(mc, x,y,z,xs,ys,zs)
  paste(mc, xn,yn,zn, obj)
}

function cut(mc, x,y,z,xs,ys,zs)
{
  obj = mc.getBlocks(x,y,z,x+xs, y+ys, z+zs)
  mc.setAllBlocks(x,y,z,x+xs,y+ys,z+zs, mc.AIR)
  mc.doit()
  return obj
}

function copy(mc, x,y,z,xs,ys,zs)
{
  obj = mc.getBlocks(x,y,z,x+xs, y+ys, z+zs)
  mc.doit()
  return obj
}

function paste(mc,x,y,z, obj)
{
  mc.setBlocks(x,y,z,obj)
  mc.doit()
}



/* tbl-js-async.js ******************************************************************/

/* (c) 2012 Thinking Binaries Ltd */

function createXmlHttpReq()
{
  //alert("createXmlHttpReq")
  if (window.ActiveXObject)
  {
    var activexmodes=["Msxml2.XMLHTTP", "Microsoft.XMLHTTP"]
    for (var i=0; i<activexmodes.length; i++)
    {
      try
      {
        return new ActiveXObject(activexmodes[i])
      }
      catch(e)
      {
      }
    }
  }
  else if (window.XMLHttpRequest)
  {
    return new XMLHttpRequest()
  }
  alert("no XMLHttpReq")
  return null
}


/* GETTER ********************************************************************/

function Getter()
{
  //alert("Getter:construct")
  this.transCount = 0
  this.xhr    = createXmlHttpReq() 
}

Getter.prototype = 
{
  get: function(url, handleData)
  {
    console.log("get")
    this.url = url
    this.handleData = handleData
    this.start()
  },

  start: function()
  {
    console.log("start")
    this.transCount++
    this.xhr.open("GET", this.url)
    var myreq = this
    this.xhr.onreadystatechange = function() 
    {
      console.log("onReadyStateChange")
      if (myreq.xhr.readyState == 4) // request finished and response ready
      {
        var s = myreq.xhr.status
        console.log("readyState:"+ myreq.xhr.readyState + " " + s)
        if (s >= 200 && s <= 299)
        {
          var data = myreq.xhr.responseText
          if (myreq.handleData)
          {
            myreq.handleData(data, myreq.transCount)
          }
        }
      }    
    }    
    this.xhr.send(null)
  }
}


/* POLLER ********************************************************************/

function Poller(url, rate, handleData)
{
  this.url        = url
  this.rate       = rate
  this.handleData = handleData  
  this.getter     = new Getter()
}

Poller.prototype =
{
  start: function()
  {
    var myreq = this
    this.getter.get(
      this.url, function(xml, trans)
      {
        if (myreq.handleData)
        {
          myreq.handleData(xml, trans)
        }
        setTimeout(myreq.start, myreq.rate)
      }
    )
  }
}   


/* POSTER ********************************************************************/

function Poster()
{
  //alert("Poster:construct")
  this.transCount = 0
  this.xhr = createXmlHttpReq() 
}

Poster.prototype = 
{
  post: function(url, requestBody, handleResponse)
  {
    //console.log("post")
    this.url = url
    this.requestBody = requestBody
    this.handleResponse = handleResponse
    this.start()
  },

  start: function()
  {
    //console.log("start")
    this.transCount++
    this.xhr.open("POST", this.url)
    this.xhr.setRequestHeader("Content-length", this.requestBody.length)

    var myreq = this
    this.xhr.onreadystatechange = function() 
    {
      //console.log("ReadyStateChange:" + myreq.xhr.readyState)
      if (myreq.xhr.readyState == 4) // request finished and response ready
      {
        var s = myreq.xhr.status
        //console.log("readyState:"+ myreq.xhr.readyState + " status:" + s)
        if (s >= 200 && s <= 299)
        {
          var data = myreq.xhr.responseText
          //console.log("data is:" + data)
          if (myreq.handleResponse)
          {
            myreq.handleResponse(data, myreq.transCount)
          }
        }
      }    
    }    
    //content-length not honoured by the server yet.
    //TODO have to make sure last line newline terminated
    //This is because the web server has a bug, it works line at a time.
    this.xhr.send(this.requestBody + "\n")
  }
}  

/***** END OF FILE *****/
 








