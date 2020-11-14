/**
 * @file: description
 * @author: zhangxing
 * @Date: 2020-11-14 22:29:24
 * @LastEditors: zhangxing
 * @LastEditTime: 2020-11-14 22:54:26
 */
let WebSocket = require('ws');

let redis = require('redis');

let client = redis.createClient();

let wss = new WebSocket.Server({ port: 3000 });

// 多个连接
let clientArr = [];

wss.on('connection', function (ws) {
  client.publish(ws);
  // 连接成功之后向前端推送
  client.lrange('barrages', 0, -1, function (err, applies) {
    applies = applies.map((item) => JSON.parse(item));
    ws.send(
      JSON.stringify({
        type: 'INIT',
        data: applies,
      })
    );
  });
  ws.on('message', function (data) {
    // 接收到的data格式： "{value, time, color, speed}"
    client.rpush('barrages', data, redis.print); // 把数据存入redis中
    // 只要有一个人发送弹幕就集体推送一次
    clientArr.forEach((w) => {
      w.send(JSON.stringify({ type: 'ADD', data: JSON.parse(data) })); // 告知前端, 需要字符串格式
    });
  });
  // 当有人关闭连接就不再推送
  ws.on('close', function () {
    clientArr = clientArr.filter((client) => client != ws);
  });
});
