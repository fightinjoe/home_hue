// https://github.com/spark/local-communication-example

TCPClient client;
bool sentFirstMessage = FALSE;

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
    // if( 0 == NULL ) { digitalWrite(D7,HIGH); } => TRUE
    // if( 0 != NULL ) { digitalWrite(D7,HIGH); } => FALSE
    // if( 0 == D0 ) { digitalWrite(D7,HIGH); } => TRUE
    // if( !0 ) { digitalWrite(D7,HIGH); } => TRUE
}

int lastButtonPressed;
unsigned long startPress = 0;
unsigned long currentPress = 0;
unsigned long longPressDuration = 1000;  // long press lasts for 1 second
bool triggered = FALSE;  // prevents a long button press from being triggered twice

void onButtonPress( int button ) {
  // Increment the button.  Checking for D0 causes problems since D0 evaluates
  // to FALSE within IF statemtns
  button = button + 1;

  if( !lastButtonPressed ) { lastButtonPressed = button; }

  // is a button currently pressed?
  if( button != lastButtonPressed ) { onButtonRelease(); }

  currentPress = millis();

  if( startPress == 0 ) {
    // if this is the first registered press of this button
    // then cache the time when the button was pressed
    startPress = currentPress;
    digitalWrite(D7, HIGH);
  } else if( currentPress - startPress > longPressDuration ) {
    // if this button is being held down for longer than longPressDuration
    // trigger the long press
    if( !triggered ) {
      // Decrement the lastButtonPressed, since we incremented it at the top
      sendMessage( "D" + String(lastButtonPressed-1) + ",long" );
    }
    triggered = TRUE;
  }
}

void onButtonRelease() {
  if( !lastButtonPressed ) { return; }

  if( !triggered && currentPress - startPress < longPressDuration ) {
    // Decrement the lastButtonPressed, since we incremented when it was cached
    sendMessage( "D" + String(lastButtonPressed-1) + ",short" );
  }

  // Reset variables
  digitalWrite(D7, LOW);
  triggered = FALSE;
  startPress = 0;
  lastButtonPressed = 0;
}

void loop() {
    if (!sentFirstMessage && client.connected()) {
        sendMessage( "Can you hear me?" );
        sentFirstMessage = TRUE;
    }

    // if the first button is pressed
    if( isPressed(D0) ) {
        onButtonPress(D0);
    } else if ( isPressed(D1) ) {
        onButtonPress(D1);
    } else {
      onButtonRelease();
    }

}