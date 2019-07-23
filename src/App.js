import React, { Component } from 'react';
import Game from './Game';
import Board from './Board';
import PubNubReact from 'pubnub-react';
import Swal from "sweetalert2";  
import shortid  from 'shortid';
import './Game.css';
 
class App extends Component {
  constructor(props) {  
    super(props);
    this.pubnub = new PubNubReact({
      publishKey: "pub-c-7582f9a0-7559-4b25-886b-fdf06848c051", 
      subscribeKey: "sub-c-66a09740-a72f-11e9-b363-464e5cb6391a"    
    });
    
    this.state = {
      piece: '',
      isPlaying: false,
      isRoomCreator: false,
      isDisabled: false,
      myTurn: false,
    };

    this.channel = null;
    this.gameChannel = null;
    this.roomId = null;    
    this.pubnub.init(this);
  }  
  
  componentWillUnmount() {
    this.pubnub.unsubscribe({
      channels : [this.channel, this.gameChannel]
    });
  }
  
  componentDidUpdate() {
    // Check that the player is connected to a channel
    if(this.channel != null){
      this.pubnub.getMessage(this.channel, (msg) => {
        // Start the game once an opponent joins the channel
        if(msg.message.notRoomCreator){
          // Create a different channel for the game
          this.gameChannel = 'tictactoegame--' + this.roomId;

          this.pubnub.subscribe({
            channels: [this.gameChannel]
          });

          this.setState({
            isPlaying: true
          });  

          // Close the modals if they are opened
          Swal.close();
        }
      }); 
    }
  }

  // Create a room channel
  onPressCreate = (e) => {
    // Create a random name for the channel
    this.roomId = shortid.generate().substring(0,5);
    this.channel = 'tictactoelobby--' + this.roomId;

    this.pubnub.subscribe({
      channels: [this.channel],
      withPresence: true
    });

    // Open the modal
    Swal.fire({
      position: 'top',
      allowOutsideClick: false,
      title: 'Share this room ID with your friend',
      text: this.roomId,
      width: 275,
      padding: '0.7em',
      // Custom CSS
      customClass: {
          heightAuto: false,
          title: 'title-class',
          popup: 'popup-class',
          confirmButton: 'confirm-button-class'
      }
    })

    this.setState({
      piece: 'X',
      isRoomCreator: true,
      isDisabled: true, // Disable the 'Create' button
      myTurn: true, // Room creator makes the 1st move
    });   
  }
  
  // The 'Join' button was pressed
  onPressJoin = (e) => {
    Swal.fire({
      position: 'top',
      input: 'text',
      allowOutsideClick: false,
      inputPlaceholder: 'Enter the room id',
      showCancelButton: true,
      confirmButtonColor: 'rgb(208,33,41)',
      confirmButtonText: 'OK',
      width: 275,
      padding: '0.7em',
      customClass: {
        heightAuto: false,
        popup: 'popup-class',
        confirmButton: 'join-confirm-button-class ',
        cancelButton: 'join-cancel-button-class'
      } 
    }).then((result) => {
      // Check if the user typed a value in the input field
      if(result.value){
        this.joinRoom(result.value);
      }
    })
  }

  // Join a room channel
  joinRoom = (joinChannel) => {
    this.roomId = joinChannel;
    this.channel = 'tictactoelobby--' + this.roomId;

    // Check the number of people in the channel
    this.pubnub.hereNow({
      channels: [this.channel], 
    }).then((response) => { 
        if(response.totalOccupancy < 2){
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
            },
            channel: this.channel
          });
        } 
        else{
          // Game in progress
          Swal.fire({
            position: 'top',
            allowOutsideClick: false,
            title: 'Error',
            text: 'Game in progress. Try another room.',
            width: 275,
            padding: '0.7em',
            customClass: {
                heightAuto: false,
                title: 'title-class',
                popup: 'popup-class',
                confirmButton: 'confirm-button-class'
            }
          })
        }
    }).catch((error) => { 
      console.log(error);
    });
  }

  // Reset everything
  endGame = () => {
    this.setState({
      piece: '',
      isPlaying: false,
      isRoomCreator: false,
      isDisabled: false,
      myTurn: false,
    });

    this.pubnub.unsubscribe({
      channels : [this.channel, this.gameChannel]
    });

    this.channel = null;
    this.gameChannel = null;
    this.roomId = null;  
  }
  
  render() {  
    return (  
        <div> 
          <div className="title">
            <p>React Tic Tac Toe</p>
          </div>

          {
            !this.state.isPlaying &&
            <div className="game">
              <div className="board">
                <Board
                    squares={0}
                    onClick={index => null}
                  />  
                  
                <div className="button-container">
                  <button 
                    className="create-button "
                    disabled={this.state.isDisabled}
                    onClick={(e) => this.onPressCreate()}
                    > Create 
                  </button>
                  <button 
                    className="join-button"
                    onClick={(e) => this.onPressJoin()}
                    > Join 
                  </button>
                </div>                        
          
              </div>
            </div>
          }

          {
            this.state.isPlaying &&
            <Game 
              pubnub={this.pubnub}
              channel={this.gameChannel} 
              piece={this.state.piece}
              isRoomCreator={this.state.isRoomCreator}
              myTurn={this.state.myTurn}
              xUsername={this.state.xUsername}
              oUsername={this.state.oUsername}
              endGame={this.endGame}
            />
          }
        </div>
    );  
  } 
}

export default App;
