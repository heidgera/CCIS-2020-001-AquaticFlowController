'use strict';

var remote = require('electron').remote;

var process = remote.process;

var config = remote.getGlobal('config');
//remote.getCurrentWindow().closeDevTools();

var obtains = [
  './src/dualGraph.js',
  './src/controller.js'
];

obtain(obtains, ({Graph}, { TempControl })=> {

  exports.app = {};

  exports.app.start = ()=> {

    console.log('started');

    var mouse = {x:0, y:0};

    var fps = 50;

///////////////////////////////////////////////////
// Temperature Tracking vs Time

    var tempTime = µ('#tempTime');

    //create Traces for current and commanded temperatures
    var crnTmp = tempTime.addTrace('#F00');
    var cmdTmp = tempTime.addTrace('#00F');

    //create the controller object
    var tempControl = new TempControl(config.io);

    //start the program with the controls disabled
    µ('input').forEach(item => item.disabled = true);

    //make the radio buttons toggle which controls are active
    µ('input[name="mode"]').forEach(item => {
      item.onchange = ()=>{
        µ(`.ctrol div input`).forEach(ip => ip.disabled = true);
        µ(`.ctrol.${item.id} div input`).forEach(ip => ip.disabled = false);

      }
    });

    var note = (msg)=>{
      µ('#notes').textContent = msg;
    }

    // set warning flags for if the device isn't connected.
    tempControl.onPortNotFound = ()=>{
      note('Please connect the apparatus.');
    }

    if(tempControl.portNotFound) note('Please connect the apparatus.');

    //initial settings for the temperature graph
    var graphTime = 600000;
    var reportFreq = 500;

    //
    crnTmp.limits.size = 36000000 / reportFreq;
    cmdTmp.limits.size = 36000000 / reportFreq;

    //set graphing ranges for the temperature traces
    crnTmp.setRanges({y: {
      min: 0,
      max: 60,
    }});
    cmdTmp.setRanges({y: {
      min: 0,
      max: 60,
    }});


    //make it so the dropdown in the topbar controls the timespan on the graph
    µ('#timeRange').onchange = (e)=>{
      console.log(e.target.value);
      graphTime = parseInt(e.target.value);
    }

    //invert the y axis for graphing, and set the traceWidth
    tempTime.params.y.flip = true;
    tempTime.traceWidth = 1;

    var info = µ('.floater')[0];
    var main = tempTime.main;

    µ('body')[0].addEventListener('mousemove',(e)=>{
      if(e.target == tempTime){
        var scaledX = (e.offsetX) / main.clientWidth;
        let crn = crnTmp.scaled;
        let search = crn.length - 1;
        while (crn.length && crn[search].x < scaledX && search > 0) search--;
        if(search < crn.length -1){
          info.style.display = 'block';
          info.style.bottom = (window.innerHeight - e.clientY + 10)+'px';
          info.style.left = `calc(${e.clientX}px - 3.5em)`;
          var time = new Date(crnTmp[search].x);
          var set = cmdTmp.find(pt=>pt.x == crnTmp[search].x);
          µ('#grTm').textContent = time.toLocaleTimeString('en-GB');
          µ('#actual').textContent = Math.round(crnTmp[search].y*100)/100;
          µ('#intended').textContent = Math.round(set.y*100)/100;
        } else {
          info.style.display = 'none';
        }
      } else {
        info.style.display = 'none';
      }
    });

    tempTime.customFGDraw = ()=>{
      var ctx = tempTime.ctx;

      var wid = tempTime.main.width;
      var hgt = tempTime.main.height;

      ctx.fillStyle = "#000";
      ctx.font = "15px monospace";
      ctx.textAlign = "center";

      var minutes = graphTime / 60000;
      var divTime = minutes / tempTime.params.x.divs;

      for (var i = 1; i <= tempTime.params.x.divs - 1; i++) {
        ctx.fillText((minutes-i*divTime), i * wid / tempTime.params.x.divs, hgt - 10);
      }

      ctx.font = "15px Verdana";
      ctx.fillText("Time (minutes)", wid/2, hgt - 30)

      ctx.font = "15px monospace";

      var maxTemp = crnTmp.limits.y.max;
      var minTemp = crnTmp.limits.y.min;
      var tempDiv = (maxTemp - minTemp) / tempTime.params.y.divs;
      for (var i = 1; i <= tempTime.params.y.divs - 1; i++) {
        ctx.fillText((maxTemp-i*tempDiv), wid - 30, i * hgt / tempTime.params.y.divs + 5);
      }

      ctx.font = "15px Verdana";
      ctx.fillText("Temp (°C)", wid - 50, 20)
    }

    setTimeout(()=>{tempTime.draw(),console.log("drawing")},500);

    // var begin = Date.now();
    //
    // setInterval(()=>{
    //   var osc = ((Date.now()-begin)/10000)%(Math.PI*2);
    //   crnTmp.add({x: Date.now(), y: 25 + Math.sin(osc)*10})
    //   cmdTmp.add({x: Date.now(), y: 20});
    //   tempTime.clear();
    //   crnTmp.setRanges({x:{
    //     min: Date.now() - graphTime,
    //     max: Date.now(),
    //   }});
    //
    //   cmdTmp.setRanges({x:{
    //     min: Date.now() - graphTime,
    //     max: Date.now(),
    //   }});
    //
    //   tempTime.draw();
    //
    //   µ('#current').textContent =  Math.round(25.5 * 100)/100;
    // },50);

// Once the controller is ready, enable some controls, start the temperature monitoring

    tempControl.onready = ()=>{
      µ('#notes').textContent = 'Controller Ready';

      µ('input').forEach(item => item.disabled = false);
      µ('input[name="mode"]').forEach(item => {
          µ(`.ctrol.${item.id} div input`).forEach(ip => ip.disabled = !item.checked);
      });

      tempControl.on('note', msg=>{
        µ('#notes').textContent = msg;
      })

      tempControl.on('setpointChanged',(temp)=>{
        if(parseFloat(temp)) µ('#cmd').textContent =  Math.round(temp * 100)/100;
        else µ('#cmd').textContent = temp;
      })

      tempControl.scheduleReport((temp)=>{
        crnTmp.add({x: Date.now(), y: temp});
        if(tempControl.setpoint != null) cmdTmp.add({x: Date.now(), y: tempControl.setpoint});
        tempTime.clear();
        crnTmp.setRanges({x:{
          min: Date.now() - graphTime,
          max: Date.now(),
        }});

        cmdTmp.setRanges({x:{
          min: Date.now() - graphTime,
          max: Date.now(),
        }});

        tempTime.draw();

        µ('#current').textContent =  Math.round(temp * 100)/100;
      }, reportFreq);


      µ('#dataFile').onchange = (e)=>{
        if(e.target.files.length){
          const reader = new FileReader();
          reader.addEventListener('load', (event) => {
            var lines = event.target.result.split('\n').map(item => item.split(',')).filter(pt=>Date.parse(pt[1]));
            lines.forEach((item, i) => {
              item[1] = Date.parse(item[1]);
            });

            µ('#notes').textContent = 'File Loaded. Press start to continue.';
            tempControl.loadData(lines);
          });
          reader.readAsText(e.target.files[0]);
          µ('#notes').textContent = 'Loading file.';
        }
      }

      µ('.ctrol.manual .go')[0].onclick = ()=>{
        console.log("setting");
        tempControl.set(parseFloat(µ('#manCmd').value));
      }

      µ('.ctrol.manual .stop')[0].onclick = ()=>{
        tempControl.disable();
        //µ('#cmd').textContent =  'NONE';
        µ('#notes').textContent = 'Temperature control stopped.';
      }

      µ('.ctrol.auto .go')[0].onclick = ()=>{
        tempControl.preheat();
      }

      µ('.ctrol.auto .stop')[0].onclick = ()=>{
        tempControl.stop();
      }
    }

    document.onkeypress = (e)=> {

    };
  };

  provide(exports);
});
