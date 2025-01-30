const { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4} = skyway_room;
let userName = "unknown"; //初期設定
let isCreatedInputs = false;
let joinerNum = 1;
// ババ抜き
let selectedFlag = false; //カードが選択されたとき
let startFlag = false; //ゲームが開始されたとき
let isHost = false; //自分がホストか
let isJoiner = false; //自分が参加者（ホスト以外）か
let player_num; 
let turns = new Array;
let turn_count = 0;
let othersInfo = new Array;
let bouns = [];
let showList = [];

let sendRightHands, sendLeftHands;
let sendCardBouns;
let sendIsShowHand;
let sendDrawCard;
let sendTurn;

// トークンを作成
const token = new SkyWayAuthToken({
    jti: uuidV4(),
    iat: nowInSec(),
    exp: nowInSec() + 60 * 60 * 24,
    scope: {
      app: {
        id: 'b7451eb6-d79b-4f1a-9e21-9e338ae5a5dc',
        turn: true,
        actions: ['read'],
        channels: [
          {
            id: '*',
            name: '*',
            actions: ['write'],
            members: [
              {
                id: '*',
                name: '*',
                actions: ['write'],
                publication: {
                  actions: ['write'],
                },
                subscription: {
                  actions: ['write'],
                },
              },
            ],
            sfuBots: [
              {
                actions: ['write'],
                forwardings: [
                  {
                    actions: ['write'],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  }).encode('ugTz1wqP2cei4oLo0icfLC3P4nolR/NVImjq9IQ0p9A=');

(async () => {
  let p = document.createElement('p');
  p.style = 'display: inline';
  p.textContent = "name: ";
  let nameInput = document.createElement('input');
  let confirm = document.createElement('button');
  confirm.textContent = "confirm"
  confirm.style = 'margin-left: 10px';
  confirm.onclick = () => {
    userName = nameInput.value;
    p.textContent = "name: " + userName;
    nameInput.remove();
    confirm.remove();
  }
  let nameArea = document.getElementById('name-area');
  nameArea.appendChild(p);
  nameArea.appendChild(nameInput);
  nameArea.appendChild(confirm);

  // HTML要素を取得
  const localVideo = document.getElementById('local-video');
  const roomButtons = document.getElementById('room-buttons');
  const buttonArea = document.getElementById('button-area');
  const roomNameInput = document.getElementById('room-name');
  const videoDiv = document.getElementById('video-area');
  const audioDiv = document.getElementById('remote-audio');
  const chatArea = document.getElementById('chat-area');
  const chats = document.getElementById('chats');
  const hostSelect = document.getElementById('host');
  const host_opt = document.getElementById('host_opt');
  const joiner_opt = document.getElementById('joiner_opt');
  const oldMaid_setbtn = document.getElementById('oldmaid_set');
  const oldMaid_startbtn = document.getElementById('oldmaid_start');
  const joiners_num = document.getElementById('joiners_num');
  let messageArea;

  const myId = document.getElementById('my-id');
  const joinButton = document.getElementById('join');

  // カメラ映像、マイクを取得
  const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream({
    video: {
      frameRate: 30,
      width: 640,
      height: 480
    }
  });
  video.attach(localVideo);
  await localVideo.play();

  // データを取得
  const dataStream = await SkyWayStreamFactory.createDataStream();
  
  joinButton.onclick = async () => {
    if (roomNameInput.value === '') return;

    joinButton.style.display = "none";
  
    const context = await SkyWayContext.Create(token);
    //部屋を作る（または参加する）
    const room = await SkyWayRoom.FindOrCreate(context, {
      type: 'p2p',
      name: roomNameInput.value,
    });

    // me = Member(LocalP2PRoomMember)
    me = await room.join();
    myId.textContent = me.id;
  
    // ストリームを発信
    await me.publish(audio);
    await me.publish(video);
    await me.publish(dataStream);
    
    let leave_btn = document.createElement('button');
    leave_btn.style.display = 'inline';
    leave_btn.textContent = 'leave';
    leave_btn.onclick = () => {
      room.leave(me);
      leave_btn.remove();
      joinButton.style.display = "inline-block";
    }
    roomButtons.appendChild(leave_btn);
    
    // ストリームを受信
    const subscribeAndAttach = (publication) => {
      if (publication.publisher.id === me.id) return;
      joiners_num.textContent = "参加人数：" + players.length;
      // 複数人が部屋に参加したときのボタンの表示切替
      if(room.members.length > 1){
        hostSelect.style.display = "inline-block";
        oldMaid_setbtn.style.display = "inline-block";
      }else{
        hostSelect.style.display = "none";
        oldMaid_setbtn.style.display = "none"
      }
      // データを受信したとき
      if(publication.contentType === 'data'){
        (async () => {
          if(!isCreatedInputs){
            // データ入力欄を作成（一度だけ）
            messageArea = document.createElement('div');
            messageArea.style = 'margin-top: 10px';
            chatArea.appendChild(messageArea);
            let messageInput = document.createElement('input');
            messageInput.type = 'text';
            chatArea.appendChild(messageInput);
            let sendButton = document.createElement('button');
            sendButton.textContent = "send";
            sendButton.onclick = () => {
              if(messageInput.value != ""){
                dataStream.write(userName + ": " + messageInput.value);
                let messageDiv = document.createElement('div');
                chats.appendChild(messageDiv);
                let message = document.createElement('p');
                message.textContent = userName + ": " + messageInput.value;
                messageDiv.appendChild(message);
                messageInput.value = "";
              }
            }
            chatArea.appendChild(sendButton);
            isCreatedInputs = true;
          }
          // データストリームを受信
          const { stream } = await me.subscribe(publication.id);
          stream.onData.add((data) => {
            if(data.includes("ババ抜きをホストしました") || data.includes("ババ抜きに参加しました")){
              // 名前の切り出し　"〇〇がババ抜きを ホスト｜参加しました"
              const name = data.split("がババ抜き")[0];
              players.push({id: publication.publisher.id, name: name, hand: []});
              joiners_num.textContent = "参加人数：" + players.length;
            }
            // 表示の処理
            if(players.length > 0){
              host_opt.disabled = true;
              joiner_opt.style.display = "inline-block";
              joiner_opt.selected = true;
            }
            if(players.length >= 2 && isHost){
              oldMaid_startbtn.style.display = "block";
            }

            /* 表示しないデータの処理
              例: "secret isHost true"　　secret:表示しない　isHost：変数　true：内容
            */
            let contents = data.split(' ');
            // console.log(data); //デバッグ用
            if(contents[0] == "secret"){
              switch(contents[1]){
                case "isJoiner":
                  if(contents[2] == "true")isJoiner = true;
                  else isJoiner = false;
                  break;
                case "players":
                  if(contents[4] == "num"){
                    players[contents[2]].hand.push({});
                    players[contents[2]].hand[contents[3]].num = Number(contents[5]);
                  }
                  else if(contents[4] == "suit") players[contents[2]].hand[contents[3]].suit = contents[5];
                  else players[contents[2]].hand[contents[3]].img = contents[5];
                  break;
                case "startFlag":
                  if(contents[2] == "true") startFlag = true;
                  else startFlag = false;
                  break;
                case "draw":
                  players.forEach(p => {
                    console.log(p.turn + " " + turn_count);
                    if(p.turn === turn_count){
                      let num = Number(contents[2]);
                      console.log(p.hand);
                      p.hand.push({num: num, suit: contents[3], img: contents[4]});
                      console.log("card is added !");
                      addedCardCheckAndDelete(p.hand);
                      console.log(p.hand);
                      // 問題↓
                      p.hand = shuffleArray(p.hand);
                    }
                    dropCard(players[Number(contents[5])].hand, Number(contents[6]));
                  })
                  break;
                case "setTurn":
                  turn_count = Number(contents[2]);
                  break; 
                case "turn":
                  players[contents[2]].turn = Number(contents[3]);
                  break;
                case "sendHands":
                  let isSame = false;
                  // データ更新
                  switch(contents[2]){
                    case "Right":
                      othersInfo.forEach(other => {
                        if(other.id === contents[3]){
                          isSame = true;
                          other.rx = Number(contents[4]); other.ry = Number(contents[5]); other.handNum = Number(contents[6]);
                        }
                      })
                      // データ追加
                      if(!isSame){
                        othersInfo.push({id:contents[3], rx:Number(contents[4]), ry:Number(contents[5]), handNum:Number(contents[6])});
                      } 
                    break;
                    case "Left":
                      othersInfo.forEach(other => {
                        if(other.id === contents[3]){
                          isSame = true;
                          other.lx = Number(contents[4]); other.ly = Number(contents[5]);;
                        }
                      })
                      // データ追加
                      if(!isSame){
                        othersInfo.push({id:contents[3], lx:Number(contents[4]), ly:Number(contents[5])});
                      } 
                    break;
                    default:
                    break;
                  }
                  break;
                case "sendCardBouns":
                  if(contents.length === 6){
                    bouns.push({x: contents[2], y: contents[3], rotation: contents[4]});
                    emptySame(fullCardBouns, contents[5]);
                    fullCardBouns.push({id: contents[5], bouns});
                    bouns = [];
                  } 
                  else bouns.push({x: contents[2], y: contents[3], rotation: contents[4]});
                  break;
                case "showList":
                  // 円を表示するフラグの管理（左手）
                  if(contents[3] === "null"){
                    if(contents[4] === "true") contents[4] = true;
                    else contents[4] = false;

                    if(showList.length === 0){
                      showList.push({id: contents[2], isShow_left: contents[4]});
                    }else{
                      showList.forEach(sl => {
                        if(sl.id && sl.id === contents[2]) sl.isShow_left = contents[4];
                        else showList.push({id: contents[2], isShow_left: contents[4]});
                      });
                    }
                  } 
                  // カードを表示するフラグの管理（右手）
                  else{
                    if(contents[3] === "true") contents[3] = true;
                    else contents[3] = false;

                    if(showList.length === 0){
                      showList.push({id: contents[2], isShow_right: contents[3]});
                    }else{
                      showList.forEach(sl => {
                        if(sl.id && sl.id === contents[2]) sl.isShow_right = contents[3];
                        else showList.push({id: contents[2], isShow_right: contents[3]});
                      });
                    }
                  }
                  break;
                default:
                  break;
              }
            }else{
              //チャット欄にメッセージを表示
              let messageDiv = document.createElement('div');
              chats.appendChild(messageDiv);
              let message = document.createElement('p');
              message.textContent = data;
              messageDiv.appendChild(message);
            }
          });
        })();
      }
      else{
        const subscribeButton = document.createElement('button');
        subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
        buttonArea.appendChild(subscribeButton);
      
        subscribeButton.onclick = async () => {
          subscribeButton.style.display = "none";
          const { stream } = await me.subscribe(publication.id);
  
          let newMedia;
          let outputCanvas;
          let canvasCtx;
          switch (stream.track.kind) {
            case 'video':
             const video = document.getElementById('stream-video' + joinerNum);
              video.videoWidth = 640;
              video.videoHeight = 480;
              video.muted = true;
              video.playsInline = true;
              video.autoplay = true;
              video.parentNode.style.display = "inline-block";
              stream.attach(video);
              outputCanvas = document.getElementById('canvas' + joinerNum);
              outputCanvas.id = publication.publisher.id;
              outputCanvas.style.zIndex = 2;
              canvasCtx = outputCanvas.getContext("2d");
              video.addEventListener('loadedmetadata', () => {
                video.play();
                drawOtherHands(video, outputCanvas, canvasCtx);
              })
              joinerNum++;
              break;
            case 'audio':
              newMedia = document.createElement('audio');
              newMedia.controls = true;
              newMedia.autoplay = true;
              newMedia.style = 'display: inline-block';
              stream.attach(newMedia);
              audioDiv.appendChild(newMedia);
              break;
            default:
              return;
          }
        }
      }

      // ババ抜きのホスト・参加ボタンの処理
      oldMaid_setbtn.onclick = async () => {
        if(!startFlag){
          if(hostSelect.value == "host"){
            isHost = true;
            player_num = players.length;
            dataStream.write(userName + "がババ抜きをホストしました");
            dataStream.write("secret isJoiner true");
          }else{
            player_num = players.length;
            dataStream.write(userName + "がババ抜きに参加しました");
          }
          players.push({id: me.id, name: userName, hand: []});
          joiners_num.textContent = "参加人数：" + players.length;
          hostSelect.style.display = "none";
          oldMaid_setbtn.style.display = "none";
        }
      }

      // ババ抜きの開始ボタン処理　　　　　ホストだけが開始できる
      oldMaid_startbtn.onclick = async () => {
        if(!isHost) return;
        if(!startFlag){
          oldMaid_startbtn.style.display = "none";
          // ババ抜きの処理
          await trump_init();
          // カードデータの共有
          players.forEach((p, index)=> {
            p.hand.forEach((card, cardIndex) => {
              dataStream.write("secret players " + index + " " + cardIndex + " num " + card.num);
              dataStream.write("secret players " + index + " " + cardIndex + " suit " + card.suit);
              dataStream.write("secret players " + index + " " + cardIndex + " img " + card.img);
            });
          });
          // 順番を決定
          for(let i=0; i<players.length; i++){
            turns.push(i);
          }
          const shuffleTurns = await shuffleArray(turns);
          players.forEach((p, index) => {
            p.turn = shuffleTurns[index];
            dataStream.write("secret turn " + index + " " + p.turn);
          });

          dataStream.write("secret startFlag true");
        }
        startFlag = true;
      }
    }
    sendRightHands = () => {
      try{
        dataStream.write(`secret sendHands Right ${players[player_num].id} ${rightHand_X} ${rightHand_Y} ${players[player_num].hand.length}`);
      }catch(e){console.log(e);}
    }
    sendLeftHands = (width) => {
      try{
        dataStream.write(`secret sendHands Left ${players[player_num].id} ${width - leftHand_X} ${leftHand_Y}`);
      }catch(e){console.log(e);}
    }
    sendCardBouns = () => {
      try{
        myCardBouns.forEach((card, i) => {
          if(myCardBouns.length-1 === i){
            dataStream.write(`secret sendCardBouns ${card.x} ${card.y} ${card.rotation} ${players[player_num].id}`);
          }
          else dataStream.write(`secret sendCardBouns ${card.x} ${card.y} ${card.rotation}`);
        })
      }catch(e){console.log(e);}
    }
    sendIsShowHand = (id, isShow_right, isShow_left) => {
      try{
        dataStream.write(`secret showList ${id} ${isShow_right} ${isShow_left}`);
      }catch(e){console.log(e);}
    }
    sendDrawCard = (num, suit, img, player_num, index) => {
      dataStream.write(`secret draw ${num} ${suit} ${img} ${player_num} ${index}`);
    }
    sendTurn = (turn) => {
      dataStream.write(`secret setTurn ${turn}`);
    }
    room.publications.forEach(subscribeAndAttach);
    room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
  };
})();