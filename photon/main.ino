// https://github.com/spark/local-communication-example

TCPClient client;

void ipArrayFromString(byte ipArray[], String ipString) {
  int dot1 = ipString.indexOf('.');
  ipArray[0] = ipString.substring(0, dot1).toInt();
  int dot2 = ipString.indexOf('.', dot1 + 1);
  ipArray[1] = ipString.substring(dot1 + 1, dot2).toInt();
  dot1 = ipString.indexOf('.', dot2 + 1);
  ipArray[2] = ipString.substring(dot2 + 1, dot1).toInt();
  ipArray[3] = ipString.substring(dot1 + 1).toInt();
}

int connectToMyServer(String ip) {
  byte serverAddress[4];
  ipArrayFromString(serverAddress, ip);

  if (client.connect(serverAddress, 9000)) {
    return 1; // successfully connected
  } else {
    return -1; // failed to connect
  }
}

void setup() {
  Spark.function("connect", connectToMyServer);

  for (int pin = D0; pin <= D7; ++pin) {
    pinMode(pin, OUTPUT);
  }
}

bool canWrite = TRUE;

void loop() {
    
  if (client.connected()) {

    digitalWrite(D7, HIGH);
    
      if( canWrite ) {
          client.write('Can you hear me?');
          canWrite = FALSE;
      }

    if (client.available()) {
      char pin = client.read() - '0' + D0;
      char level = client.read();
      if ('h' == level) {
        digitalWrite(pin, HIGH);
      } else {
        digitalWrite(pin, LOW);
      }
    }
  }
}