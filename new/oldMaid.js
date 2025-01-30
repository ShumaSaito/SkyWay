/*
  trump : カード全体
  card : カード単体
  hand : 手札（カードの配列）
*/

let trump = [];
let trump_shuffle = [];
let players = new Array;
const cardHeight = 160;
const cardWidth = 100;
let selectedCards;
let selectedCardSaved = null;
let drawCard;
let lastTime = 0;
let countTime = 0;
const video = document.getElementById("local-video");

// トランプのセットアップ（カードデータ作成、分配、同じ数字を捨てる処理）
const trump_init = async() => {
    let maxNum = 8; //配る数字の最大(最後の値はババ)　初期設定では1~10とババが最大
    switch(players.length){
        case 2:
        break;
        case 3:
            maxNum = 6;
        break;
        case 4:
            maxNum = 4;
        break;
        default:
            maxNum = 3;
        break;
    }
    // カードのデータを用意
    for(let i=0; i<=maxNum; i++){
        // ジョーカーの処理
        if(i == maxNum){
            trump.push({num:i});
            trump[maxNum*4].suit = null;
            trump[maxNum*4].img = 'cards_img/joker.png';
            break;
        }
        //各トランプの初期設定
        for(let j=0; j<4; j++){
            trump.push({num:i});
            switch(j){
                case 0:
                    trump[j+4*i].suit = 'clover';
                    trump[j+4*i].img = 'cards_img/clover'+(i+1)+'.png';
                    break;
                case 1:
                    trump[j+4*i].suit = 'dia';
                    trump[j+4*i].img = 'cards_img/dia'+(i+1)+'.png';
                    break;
                case 2:
                    trump[j+4*i].suit = 'heart';
                    trump[j+4*i].img = 'cards_img/heart'+(i+1)+'.png';
                    break;
                case 3:
                    trump[j+4*i].suit = 'spade';
                    trump[j+4*i].img = 'cards_img/spade'+(i+1)+'.png';
                    break;
                default:
                    break;
            }
        }
    }

    trump_shuffle = await shuffleArray(trump);
    await distribute();
    await drop_two_all(players);
    // 個々の手札をシャッフル
    players.forEach(async(p) => {
        p.hand = await shuffleArray(p.hand);
    });
}

// カード配列をシャッフル
const shuffleArray = async(array) => {
    const cloneArray = [...array] //スプレッド構文
    for (let i = cloneArray.length - 1; i >= 0; i--) {
      let rand = Math.floor(Math.random() * (i + 1))
      // 配列の要素の順番を入れ替える
      let tmpStorage = cloneArray[i]
      cloneArray[i] = cloneArray[rand]
      cloneArray[rand] = tmpStorage
    }
    return cloneArray
}

// 各プレイヤーにカードを配る
const distribute = async() => {
    if(players.length < 2) return;
    let num = 0;
    // 一枚ずつ配る
    for(let i=0; i<trump_shuffle.length; i++){
        players[num].hand.push(trump_shuffle[i]);
        num = (num+1)%players.length;
    }
}

// 同じ数字を手札から捨てる（プレイヤー全員に対して）
const drop_two_all = async(players) => {
    players.forEach(p => {
        drop_two(p);
    })
}

const drop_two = async(player) => {
    const p = player;
    // 手札を昇順に並び替える（同じ数字のカードを捨てるための準備）
    p.hand.sort((a, b) => {
        return a.num-b.num;
    })

    let delete_index = []; // 削除する要素の番号を格納
    for(let i=0; i<p.hand.length-1; i++){
        let target = p.hand[i]['num'];
        for(let j=i+1; j<p.hand.length; j++){
            if(target === p.hand[j]['num']){
                delete_index.push(i, j);
                if(i+1==j) i++; // 次のループで捨てたカードを比較するのを防ぐ
                break;
            }
        }
    }
    delete_index.forEach(index => {
        p.hand[index]['num'] = 'drop_card';
    })
    let dropedHand = p.hand.filter((hand) => hand.num != 'drop_card');
    p.hand = dropedHand;
}

// カードオブジェクトの比較
const isEqualCards = (card1, card2) => {
    if (
        card1.num === card2.num &&
        card1.suit === card2.suit
    ) {
        return true
    }
    return false
}

// 選択したカードを追加

const isNotChangeSelected = () => {
    if(!startFlag || selectedFlag) return;
    // 監視対象を設定
    if(!selectedCardSaved) selectedCardSaved = selectedCards;
    const currentTime = Math.floor(video.currentTime);
    console.log(`card:${selectedCardSaved} time:${countTime}`)
    // 5秒経過すると選択を固定
    if(countTime >= 5){
        selectedFlag = true;
        drawCard = selectedCardSaved;
        selectedCardSaved = null;
        console.log(drawCard);
    }
    // 時間が進むと選択されたカードの変更の判定を行う
    if(currentTime > lastTime){
        lastTime = currentTime;
        countTime++;
        if(!selectedCardSaved || selectedCards.index != selectedCardSaved.index){
            countTime = 0;
            selectedCardSaved = null;
        }
    }
}

const addedCardCheckAndDelete = (hand) => {
    let addedCard = hand[hand.length-1];
    hand.forEach((card, i) => {
        if(card.num === addedCard.num && i > hand.length-1){
            hand.splice(i, 1);
            return;
        }
    })
}

const dropCard = (hand, index) => {
    hand.splice(index, 1);
}