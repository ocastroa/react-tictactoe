import React, { Component } from 'react';
import Game from './Game';
import PubNubReact from 'pubnub-react';
import Swal from "sweetalert2";  
import shortid  from 'shortid';
 
class App extends Component {
  constructor(props) {  
    super(props);
    this.pubnub = new PubNubReact({
      publishKey: "ENTER_YOUR_PUBLISH_KEY_HERE", 
      subscribeKey: "ENTER_YOUR_SUBSCRIBE_KEY_HERE"    
    });
    
    this.state = {
      username: '',
      piece: '',
      xUsername: '',
      oUsername: '',
      isPlaying: false,
      // is_waiting: false,
      isRoomCreator: false,
      isDisabled: false
    };

    this.gameChannel = null;
    this.pubnub.init(this);    
  }  
  
  componentWillUnmount() {
    this.pubnub.unsubscribe({
      channels : ['gameLobby', this.channel]
    });
  }
  
  componentDidMount() {
    this.pubnub.subscribe({
      channels: ['gameLobby'],
      withPresence: true
    });

    this.pubnub.getMessage('gameLobby', (msg) => {
      // Set username for Player X
      if(msg.message.isRoomCreator){
        console.log('room creator sent message');
        this.setState({
          xUsername: msg.message.username
        })
      }
      else if(msg.message.notRoomCreator){
        console.log('not room creator sent message');
        console.log('piece:' + this.state.piece);
        this.pubnub.unsubscribe({
          channels : ['gameLobby']
        }); 
        this.setState({
          oUsername: msg.message.username,
          isPlaying: true
        });  
      }
    });
  }

  addUsername = (e) => {
    this.setState({username: e.target.value});
  }

  onPressCreate = () => {
    if(this.state.username === ''){
      Swal.fire({  
        position: 'top',
        text: 'Please enter your username', 
        width: 230,
        customClass: {
            heightAuto: false
        } ,
      }); 
    }
    else{
      // Random channel name generated
      let roomId = shortid.generate();
      let shorterRoomId = roomId.substring(0,5);
      roomId = shorterRoomId;
      this.channel = 'tictactoe--' + roomId;
      console.log(this.channel);
      this.pubnub.subscribe({
        channels: [this.channel],
        withPresence: true
      });

      Swal.fire({
        position: 'top',
        title: 'Share this room ID with your friend',
        text: roomId,
        width: 300,
        customClass: {
            heightAuto: false
        }
      })
  
      this.setState({
        piece: 'X',
        isRoomCreator: true
      });  

      this.pubnub.publish({
        message: {
          isRoomCreator: true,
          username: this.state.username
        },
        channel: 'gameLobby'
      });  
    }
  }

  onPressJoin =  () => {
    if(this.state.username === ''){
      Swal.fire({  
        position: 'top',
        text: 'Please enter your username', 
        width: 230,
        customClass: {
            heightAuto: false
        } ,
      }); 
    }

    else{
      Swal.fire({
        input: 'text',
        inputPlaceholder: 'Enter the room id',
        showCancelButton: true,
        confirmButtonText: 'Ok',
        width: 280,
        customClass: {
          heightAuto: false
       } 
      }).then((result) => {
        if(result.value){
          this.joinRoom(result.value);
        }
      })
      // this.setState({isDisabled: true});
      // this.joinRoom();
    }
  }

  joinRoom = (roomId) => {
    this.channel = 'tictactoe--' + roomId;
    console.log(this.channel);
    this.pubnub.subscribe({
      channels: [this.channel],
      withPresence: true
    });

    this.setState({
      piece: 'O',
    });  
    
    this.pubnub.publish({
      message: {
        notRoomCreator: true,
        username: this.state.username
      },
      channel: 'gameLobby'
    });

    
    // Check that the lobby is not full
    // this.pubnub.hereNow({
    //   channels: [this.channel], 
    // }).then((response) => { 
    //   console.log(response.totalOccupancy);
    //   // If totalOccupancy is less than or equal to 1, then player can't join a room since it has not been created
    //   if(response.totalOccupancy <= 1){
    //     console.log('lobby empty')     
    //   }
    //   else if(response.totalOccupancy === 2){
    //     this.pubnub.subscribe({
    //       channels: [this.channel],
    //       withPresence: true
    //     });
        
    //     this.setState({
    //       piece: 'O',
    //     });  
        
    //     this.pubnub.publish({
    //       message: {
    //         notRoomCreator: true,
    //         username: this.state.username
    //       },
    //       channel: 'gameLobby'
    //     });
    //   } 
    //   else{
    //     console.log('lobby full')
    //   }
    // }).catch((error) => { 
    //     console.log(error)
    // });
  }
  
  render() {  
      const gameInfo = {
        marginLeft: '40px'
      };

    return (  
        <div> 
          {
            this.state.isPlaying &&
            <Game 
              pubnub={this.pubnub}
              channel={this.channel} 
              piece={this.state.piece}
              isRoomCreator={this.state.isRoomCreator}
              xUsername={this.state.xUsername}
              oUsername={this.state.oUsername}
            />
          }

          {
            !this.state.isPlaying &&
            <div style={gameInfo}>
              <div>
                <input 
                  type="text" 
                  onChange={ this.addUsername } 
                  placeholder="Enter your username"
                  />
              </div>
              <div>
                <button 
                  disabled={this.state.isDisabled}
                  onClick={(e) => this.onPressCreate()}
                  > Create 
                </button>
                <button 
                  disabled={this.state.isDisabled}
                  onClick={(e) => this.onPressJoin()}
                  > Join 
                </button>
              </div>
            </div>    
          }
        </div>
    );  
  } 
}

export default App;
