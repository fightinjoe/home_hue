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

  if( client.connected() ) {
      sentFirstMessage = FALSE;
      client.stop();
    }

  if (client.connect(serverAddress, 9000)) {
    return 1; // successfully connected
  } else {
    sos();
    return -1; // failed to connect
  }
}

// Flash the D7 LED multiple times.
//   int duration_on: the number of milliseconds the light should stay on
//   int duration_off: the number of milliseconds the light should stay off
//                     before cycling.  Does not happen on the last light up.
void flash(int duration_on, int duration_off, int repeat) {
  while( repeat ) {
    repeat--;
    digitalWrite(D7, HIGH);
    delay(duration_on);
    digitalWrite(D7, LOW);
    if( repeat) { delay(duration_off); }
  }
}


// Recursive function for writing morse code to the D7 LED
int morseBreak = 25;
int morseDot   = 100;
int morseDash  = morseDot*3;

void morse( String message ) {
    if( !message.length() ) { return; }
    
    if( message.startsWith(".") ) {
        flash(morseDot,0, 1);
        delay(morseBreak);
    } else if ( message.startsWith("_") ) {
        flash(morseDash, 0, 1);
    } else if ( message.startsWith(" ") ) {
        delay(morseBreak*10);
    }
    
    return morse( message.substring(1) );
}

void sos() {
    morse("...---...  ");
}

bool isPressed( int button ) {
    return digitalRead( button ) == HIGH;
}

bool sendMessage( String message ) {
    if( !client.connected() ) {
        // CXN - bad connection
        morse("-.-. -..- -.");
    }
    
    if( !client.available() ) {
        // NO1 - unavailable
        morse("-. --- .----");
    }

    client.write(message + "\r\n");
    // AOK
    // morse(".- --- -.-");
}

void setup() {
  Particle.function("connect", connectToMyServer);

  for (int pin = D0; pin <= D7; ++pin) {
    pinMode(pin, OUTPUT);
  }

    pinMode( D0, INPUT );
    pinMode( D1, INPUT );

    digitalWrite(D7, LOW);
}

bool sentFirstMessage = FALSE;

void loop() {
    // if the first button is pressed
    if( isPressed(D0) ) {
        sendMessage("D0");
    } else if ( isPressed(D1) ) {
        sendMessage("D1");
    }

    if (!sentFirstMessage && client.connected()) {

        sendMessage( "Can you hear me?" );
        sentFirstMessage = TRUE;
    }
}