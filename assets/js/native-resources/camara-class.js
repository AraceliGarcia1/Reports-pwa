class Camera{
    constructor(node){
        this.node=node;

    }
    powerOn(){
        navigator.mediaDevices.getUserMedia({
            audio:false,
            video:{width:300, height:300},
        }).then((stream)=>{
            this.node.srcObject= stream;
            this.stream = stream;
        })
    }
    powerOf(){
        this.node.pause();
        if(this.stream)this.stream.getTracks()[0].stop();
    }
    takePhoto(){
        let canvas = document.createElement('canvas');
        canvas.setAttribute('width', 300);
        canvas.setAttribute('height', 300);
        let context =canvas.getContext('2d');
        context.drawImage(this.node, 0, 0, canvas.width, canvas.height);
        this.photo = context.canvas.toDataURL(); // pasa a ser una img base 64

        canvas = null;
        context=this.null;
        return this.photo;
    }
}