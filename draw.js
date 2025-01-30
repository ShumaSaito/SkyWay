let rightHand_X, rightHand_Y;
let leftHand_X, leftHand_Y
let myCardBouns = [];
let fullCardBouns = [];
let isHandsChanged = false;
let isShowPoint;

const getXY = (ctx, handLandMarks) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    let x1, y1, x2, y2;
    let isOverlapping = false;
    for(const landmarks of handLandMarks){
        // 手の関節ごとの座標がある
        x1 = landmarks[4].x * width;
        y1 = landmarks[4].y * height;
        x2 = landmarks[8].x * width;
        y2 = landmarks[8].y * height;
    }
    if(Math.pow((10+10), 2) >= Math.pow((x1-x2), 2) + Math.pow((y1-y2), 2)) isOverlapping = true;
    return [x1, y1, x2, y2, isOverlapping];
}

const drawCircle = (ctx, target) => {
    let x, y;
    if(target === "own"){
        x = leftHand_X;
        y = leftHand_Y;
    }else{
        let id;
        let player;
        players.forEach(p => {
            if(p.turn === turn_count%players.length) id = p.id;
        })
        othersInfo.forEach(other => {
            if(other.id === id) player = other;
        })
        x = player.lx;
        y = player.ly;
    }
    // 線の色と長さ
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;

    // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2*Math.PI);
    ctx.stroke();
}

// 自分の手札を表示->isNullImage false :: 相手の手札を表示->isNullImage true
const drawHands = (ctx, hands, handLandMarks, x, y, isNullImage, handNum) => {
    let isOverlapping;
    if(x===null || y===null) {
        for(const landmarks of handLandMarks){
            x = landmarks[7].x * ctx.canvas.width;
            y = landmarks[7].y * ctx.canvas.height;
        }
    }
    x = ctx.canvas.width - x;
    rightHand_X = x;
    rightHand_Y = y;
    const centerX = x;
    const centerY = y;
    const radius = 60; // 中心位置からの距離
    const angleRange = 150; // 全体の角度
    if(isNullImage){
        const angleStep = angleRange / (handNum-1); // 一枚当たりの角度

        let othersCardBouns;
        if(turn_count%players.length == players[player_num].turn){
            players.forEach(p => {
                if(p.turn === (turn_count+1)%players.length){
                    fullCardBouns.forEach(fcb => {
                        if(fcb.id === p.id){
                            othersCardBouns = fcb;
                        } 
                    })
                }
            })
        }
    
        for(let i=0; i<handNum; i++){
            const img = new Image();
            img.src = 'cards_img/trump.png';

            // img.onload = () => {
                // カードごとの角度と表示位置の計算
                const angleStart = -angleRange / 2;
                const angle = angleStart + i * angleStep; //角度を変化
                const radian = ((angle-90) * Math.PI) / 180;
                const cardX = centerX + radius * Math.cos(radian);
                const cardY = centerY + radius * Math.sin(radian);

                ctx.save();
                ctx.translate(cardX, cardY) ; // 中心に移動
                ctx.rotate(radian + Math.PI/2); // 回転
                ctx.drawImage(img, -50, -80, cardWidth, cardHeight); // カードを描画
                ctx.restore();
            // }

            img.onerror = () => {
                console.error("Image load failed");
            }
            // console.log(`debug ctx:${ctx} x:${x} y:${y} handNum:${handNum}`);
        }
    }
    else{
        // if(isOverlapping){
            if(myCardBouns.length === 0 ) isHandsChanged = true; //初期設定用
            fullCardBouns.forEach(fcb => {
                try{
                    if(fcb.id === players[player_num].id){
                        if(fcb.myCardBouns.length != hands.length){ // 手札の変化
                            isHandsChanged = true;
                            fcb.myCardBouns = [];
                        }
                    }
                }catch(e) {console.log(e);}
            })

            const angleStep = angleRange / (hands.length-1); // 一枚当たりの角度
            
            hands.forEach((hand, i) => {
                // 画像のソースを変換
                const img = new Image();
                img.src = hand.img;
    
                // img.onload = () => {
                    // カードごとの角度と表示位置の計算
                    const angleStart = -angleRange / 2;
                    const angle = angleStart + i * angleStep; //角度を変化
                    const radian = ((angle-90) * Math.PI) / 180;
                    const cardX = centerX + radius * Math.cos(radian);
                    const cardY = centerY + radius * Math.sin(radian);

                    if(isHandsChanged){
                        // カード座標の記録
                        myCardBouns.push({
                            x: cardX,
                            y: cardY,
                            rotation: radian + Math.PI/2
                        });
                    }
                    
                    // 更新
                    if(myCardBouns[i]){
                        myCardBouns[i].x = cardX;
                        myCardBouns[i].y = cardY;
                        myCardBouns[i].rotation = radian + Math.PI/2;
                    }
                    
                    ctx.save();
                    ctx.translate(cardX, cardY) ; // 中心に移動
                    ctx.rotate(radian + Math.PI/2); // 回転
                    ctx.drawImage(img, -cardWidth/2, -cardHeight/2, cardWidth, cardHeight); // カードを描画
                    if(players[player_num].turn === (turn_count+1)%players.length){
                        // console.log(checkOwn(myCardBouns[i]));
                        if(checkOwn(myCardBouns[i], i)){
                            ctx.save();
                            ctx.lineWidth = 2;
                            ctx.strokeStyle = "red";
                            ctx.strokeRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
                            ctx.restore();
                        }
                    }
                    ctx.restore();
                img.onerror = () => {
                    console.error("Image load failed:", hand.img);
                }
            });
            // 同じidの要素を削除し、新たに追加
            emptySame(fullCardBouns, players[player_num].id);
            fullCardBouns.push({id: players[player_num].id, myCardBouns});

            // if(isHandsChanged){
                sendCardBouns();
                isHandsChanged = false;
            // } 
        // }
        // return isOverlapping;
    }
}

const drawEnemyHand = (canvasId, x, y, handNum) => {
    try{
        const canvas = document.getElementById(canvasId);
        const canvasCtx = canvas.getContext("2d");
        // 文字列を数値に変換
        x = Number(x); y = Number(y); handNum = Number(handNum);
        drawHands(canvasCtx, null, null, x, y, true, handNum);
    }catch(e) { console.log(e)};
}

const drawOtherHands = (video, outputCanvas, canvasCtx) => {
    outputCanvas.width = video.videoWidth;
    outputCanvas.height = video.videoHeight;
    let isShow = false;
    showList.forEach(sl => {
        if(sl.id === outputCanvas.id) isShow = sl.isShow_right;
    })
    if(startFlag && isShow){
        let id;
        players.forEach(p => {
            if(p.turn === (turn_count+1)%players.length) id = p.id;
        })
        othersInfo.forEach(other => {
            drawEnemyHand(other.id, other.rx, other.ry, other.handNum);
            if(isShowPoint && outputCanvas.id === id) drawCircle(canvasCtx, "own");
        });
    }
  requestAnimationFrame(() => drawOtherHands(video, outputCanvas, canvasCtx));
}

const checkOwn = (card, index) => {
    try{
        let isTouch
        let player;
        let target;
        players.forEach(p => {
            if(p.turn === turn_count%players.length) player = p;
        })
        othersInfo.forEach(other => {
            if(other.id === player.id) target = other;
        })
        // console.log(`other.lx:${target.lx} other.ly${target.ly}`);
        isTouch = checkCardTouch(target.lx, target.ly, card);
        if(isTouch) selectedCards = {index: index, card: players[player_num].hand[index]};
        return isTouch;
    }catch(e){
        console.log(e);
        return false;
    }
}

const checkCardTouch = (pointX, pointY, rect) => {
    const { x, y, rotation } = rect; // カードオブジェクト
    // console.log(pointX + " " + pointY + " " + x + " " + y + " " +rotation)
    const width = cardWidth;
    const height = cardHeight;

    // カードの回転角度を逆方向に使用してローカル座標系に変換
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);

    // 点とカードの中心の差分を計算
    const dx = pointX - x; 
    const dy = pointY - y;

    // ローカル座標系に変換（カードと点を共通の基準に揃える）
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

        // console.log(`X:${localX}`);
        // console.log(`Y:${localY}`);

    // 矩形の範囲内かをチェック
    return (
        localX >= -width / 2 &&
        localX <= width / 2 &&
        localY >= -height / 2 &&
        localY <= height / 2
    );
};

const emptySame = (array, id) => {
    try{
        array.forEach((arr, i) => {
            if(arr.id === id){
                array.splice(i, 1);
            } 
        })
    }catch(e){ console.log(e)}
}