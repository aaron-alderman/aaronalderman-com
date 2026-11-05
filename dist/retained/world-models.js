// Small declared browser illustrations. No empirical data are generated here.
export function allowedPairs(limit){return Array.from({length:25},(_,i)=>[i%5,Math.floor(i/5)]).filter(([x,y])=>x+y<=Number(limit));}
export function positivePairs(coupling){return Array.from({length:25},(_,i)=>[i%5,Math.floor(i/5)]).filter(([x,y])=>x*y>=Number(coupling)**2);}
export function inflatePair(step){let a=1,b=1;for(let i=0;i<Math.max(0,Math.min(5,Number(step)));i++)[a,b]=[2*a+b,a+b];return [a,b];}
export function decodeRepetition(bits){return bits.reduce((a,b)=>a+b,0)>=2?1:0;}
export function weightedOptions(percent){const w=Number(percent)/100;return {a:8*w+2*(1-w),b:2*w+8*(1-w)};}
export function memoryTrace(coupled=true){
 let x=1,h=1.2;const samples=[{t:0,x,h}],c=coupled?.6:0,dt=.02;
 for(let i=1;i<=400;i++){const dx=-x+c*h,dh=-.8*h+c*x;x+=dt*dx;h+=dt*dh;if(i%4===0)samples.push({t:i*dt,x,h});}
 return samples;
}
export const cellPattern=[1,0,1,0,0,1,0,1,1,0,1,0,0,1,0,1];
export function coarseCells(blockSize){
 const block=Number(blockSize),out=[];
 for(let row=0;row<4;row+=block)for(let col=0;col<4;col+=block){let sum=0;for(let y=0;y<block;y++)for(let x=0;x<block;x++)sum+=cellPattern[(row+y)*4+col+x];out.push({mean:sum/(block*block),total:sum});}
 return out;
}
export const reportedRates=[
 {rate:4,overlap:.974814,loss:.008035},
 {rate:8,overlap:.987749,loss:.015930},
 {rate:16,overlap:.983122,loss:.031568},
 {rate:32,overlap:.968219,loss:.062121}
];
