//var ps = obtain('µ/pointStack.js');


obtain([], ()=> {
  if (!customElements.get('muse-graph')) {

    var scale = (val, bounds)=>(val - bounds.min) / (bounds.max - bounds.min);

    class PointArray extends Array{
      constructor(){
        super();

        this.limits = {
          x: {
            min:0,
            max:1,
          },
          y: {
            min:0,
            max:1,
          },
          size: 2000,
        }
      }

      get scaled(){
        var _this = this;
        var ret = this.map(val=>{return {
          x: scale(val.x,this.limits.x),
          y: scale(val.y,this.limits.y)
        }});
        ret.color = this.color;
        return ret;
      }

      add(next){
        this.unshift(next);
        while(this.length>this.limits.size) this.pop();
      }

      clear(){
        this.length =0;
      }

      setRanges(ranges){
        if(ranges.x) this.limits.x = ranges.x;
        if(ranges.y) this.limits.y = ranges.y;
      }
    }

    class DualGraph extends HTMLElement {
      constructor() {
        super();

        //this.points = new PointArray();

        this.traces = [];

        this.params = {
          x:{
            flip: false,
            divs: 10,
          },
          y:{
            flip: false,
            divs: 10,
          }
        }

        //this.labelFont = 'lighter 2vh sans-serif';
        //this.fontColor = '#000';
        this.traceWidth = 3;
        this.traceColor = '#000';
        this.gridWidth = 1;
        this.gridColor = 'rgba(0,0,0,.1)';
      }

      addTrace(color){
        var temp = new PointArray();
        temp.color = color;
        this.traces.push(temp);
        return temp;
      }

      clear() {
        this.main.width = this.clientWidth;
        this.main.height = this.clientHeight;
        //this.ctx.translate(0.5, 0.5);
      }

      drawTrace(points) {
        var ctx = this.ctx;
        ctx.lineWidth = this.traceWidth;
        ctx.strokeStyle = points.color;

        var wid = this.main.width;
        var hgt = this.main.height;

        var _this = this;

        if(_this.params.x.flip) points = points.map(val=>{return {x: 1-val.x, y: val.y}});
        if(_this.params.y.flip) points = points.map(val=>{return {x: val.x, y: 1-val.y}});

        var oldAlpha = ctx.globalAlpha;

        if (points.length > 2) {
          var xc = wid * (points[0].x + points[1].x) / 2;
          var yc = hgt * (points[0].y + points[1].y) / 2;
          ctx.beginPath();
          ctx.moveTo(xc, yc);
          for (var i = 0; i < points.length - 1; i++) {
            if (_this.fade) ctx.globalAlpha = 1-(i / points.length);
            xc = wid * (points[i].x + points[i + 1].x) / 2;
            yc = hgt * (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x * wid, points[i].y * hgt, xc, yc);

            if (_this.fade) {
              ctx.stroke();
              ctx.closePath();
              ctx.beginPath();
              ctx.moveTo(xc, yc);
            }

          }

          if (_this.fade) ctx.globalAlpha = oldAlpha;

          ctx.stroke();
          ctx.closePath();

        }

      };


      drawGrid() {
        var ctx = this.ctx;
        ctx.lineWidth = this.gridWidth;
        ctx.strokeStyle = this.gridColor;

        var wid = this.main.width;
        var hgt = this.main.height;

        for (var i = 0; i <= this.params.x.divs; i++) {
          ctx.beginPath();
          ctx.moveTo(i * wid / this.params.x.divs, 0);
          ctx.lineTo(i * wid / this.params.x.divs, hgt);
          ctx.closePath();
          ctx.stroke();
        }

        for (var i = 0; i <= this.params.y.divs; i++) {
          ctx.beginPath();
          ctx.moveTo(0, i * hgt / this.params.y.divs);
          ctx.lineTo(wid, i * hgt / this.params.y.divs);
          ctx.closePath();
          ctx.stroke();
        }

      };

      customBGDraw() {
      };

      customFGDraw() {
      };

      draw() {
        //console.log(this.width);
        var ctx = this.ctx;
        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.rect(0, 0, this.width, this.height);
        ctx.closePath();
        ctx.fill();

        this.customBGDraw();

        for(var i=0; i<this.traces.length; i++){
          this.drawTrace(this.traces[i].scaled);
        }


        this.drawGrid(ctx);

        this.customFGDraw();
      };

      setDrawInterval(time){
        if(_this.drawInterval) clearInterval(_this.drawInterval);
        _this.drawInterval = setInterval(()=>{
          _this.draw();
        }, time);
      }

      setRanges(ranges){
        if(ranges.x) this.points.limits.x = ranges.x;
        if(ranges.y) this.points.limits.y = ranges.y;
      }

      // addPoint(pt){
      //   this.points[0].add(pt);
      // }

      setMaxPoints(num){
        this.points.limits.size = num;
      }

      connectedCallback() {
        //register events, check contents, etc.
        var _this = this;

        if (!_this.shadowRoot) {
          _this.root = _this.attachShadow({ mode: 'open' });

          _this.root.innerHTML = `<style> @import "${µdir}/components/css/graph.css";</style>`;

          _this.main = µ('+canvas', _this.root);

          _this.ctx = _this.main.getContext('2d');

          _this.main.width = this.clientWidth;
          _this.main.height = this.clientHeight;
        }

        _this.onresize = ()=>{
          _this.main.width = _this.clientWidth;
          _this.main.height = this.clientHeight;
        }
      };
    };

    customElements.define('dual-graph', DualGraph);
  }

  exports.DualGraph = customElements.get('dual-graph');

  provide(exports);
});
