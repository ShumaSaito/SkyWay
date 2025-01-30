// Media Pipe Handpose サンプルコード: https://zenn.dev/tkada/articles/600efba2db186b
import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

import Stats  from 'https://cdnjs.cloudflare.com/ajax/libs/stats.js/r17/Stats.min.js';

let results;
/* 
handednesses[0].categoryName 'Right' : 'Left'
landmarks[]
*/

const getResults = () => { return results};
const init = async () =>{
const stats = new Stats();
document.body.appendChild(stats.dom);

const video = document.getElementById("local-video");
const canvasElement = document.getElementById("output_canvas"); 
const canvasCtx = canvasElement.getContext("2d");

const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
);

const handLandmarker = await HandLandmarker.createFromOptions(
    vision,
    {
      baseOptions: {
        modelAssetPath: "./hand_landmarker.task", //.taskファイルを指定する
        delegate: "CPU" //CPU or GPUで処理するかを指定する
      },
      numHands: 2 //認識できる手の数
      // minDetectionConfidence: 0.6,
      // minTrackingConfidence: 0.6
    });

await handLandmarker.setOptions({ runningMode: "video" });

let lastVideoTime = -1;

const renderLoop = () => {
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;
  let startTimeMs = performance.now();
  isShowPoint = false;

  if (video.currentTime > 0 && video.currentTime !== lastVideoTime) {
    results = handLandmarker.detectForVideo(video, startTimeMs);
    // console.log(results)
    lastVideoTime = video.currentTime;
  
    // カメラ映像の描画
    if (results.landmarks) {
      if(startFlag){
        if(results.handednesses.length>=1 && results.handednesses[0][0].categoryName === "Left" && turn_count%players.length==players[player_num].turn){
          // draw.js
            let [x, y, , , isOverlapping] = getXY(canvasCtx, results.landmarks);
            try{
              if(isOverlapping){
                leftHand_X = canvasElement.width-x; leftHand_Y = y;
                let ctx;
                players.forEach(p => {
                  if((turn_count+1)%players.length==p.turn){
                    let canvas = document.getElementById(p.id);
                    ctx = canvas.getContext("2d");
                  } 
                })
                isShowPoint = true;
                sendLeftHands(canvasElement.width);
              }
            }
            catch(e){
              console.log(e);
            }
        }
        // 自分のターンで左手が映っていないとき
        // if(turn_count%players.length==players[player_num].turn && results.handednesses.length>=1 && !results.handednesses[0][0].categoryName === "Left"){
        //   leftHand_X = 0, leftHand_Y = 0;
        //   sendLeftHands(canvasElement.width);
        // }
        sendIsShowHand(players[player_num].id, null, isShowPoint);
        if(results.handednesses.length>=1 && results.handednesses[0][0].categoryName === "Right"){
          let player;
          let isShowLeft = false;
          players.forEach(p => {
            if(p.turn === turn_count%players.length) player = p;
          })
          showList.forEach(sl => {
            if(sl.id === player.id) isShowLeft = sl.isShow_left;
          })
          drawHands(canvasCtx, players[player_num].hand, results.landmarks, null, null, null, null);
          if(isShowLeft) drawCircle(canvasCtx, "others");
          // 1秒ごとにデータを送信
          // const currentTime = Math.floor(video.currentTime);
          // if(currentTime > lastTime){
          //   lastTime = currentTime;
          try{
            sendRightHands();
            sendIsShowHand(players[player_num].id, true, null);
          }
          catch(e){
            console.log(e);
          }
          // } 
        }else{
          sendIsShowHand(players[player_num].id, false, null);
        }
        if((turn_count+1)%players.length==players[player_num].turn) isNotChangeSelected();
        // ババ抜き
        // let player_count = 0;
        // players.forEach(p => {
        //   if(!p.skip) player_count++;
        // });
        // if(player_count <= 1){
        //   startFlag = false;
        //   if(isHost) dataStream.write("ゲームが終了しました");
        // }
        // // 自分のターンかつ手札が残っている状態
        // if(turn_count%players.length == players[player_num].turn && !players[player_num].skip){
        //   if(players[player_num].hand.length < 1) players[player_num].skip = true;
        //   // ターン変数の更新
        //   turn_count++;
        //   sendTurn(turn_count);
        // }
        // カードを引く処理
        if(selectedFlag){
          selectedFlag = false;
          turn_count++;
          sendTurn(turn_count);
          dropCard(players[player_num].hand, drawCard.index);
          sendDrawCard(drawCard.card.num, drawCard.card.suit, drawCard.card.img, player_num, drawCard.index);
          setTimeout(()=>{console.log("waiting");}, 3000);
          drawCard = null;
        }
      }
    }
  }

  requestAnimationFrame(() => {
    stats.begin();
    renderLoop();
    stats.end();
  });
}
renderLoop();  
}

init();