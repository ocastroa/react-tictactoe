import React from 'react';
import Board from './Board';
import Swal from "sweetalert2";  

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      squares: Array(9).fill(''),
      myTurn: false,
      xScore: 0,
      oScore: 0,
    };

    this.turn = 'X';
    this.gameOver = false;
    this.counter = 0;
  }

  componentWillMount(){
    this.props.pubnub.getMessage(this.props.channel, (msg) => {
      if(msg.message.turn === this.props.piece){
        console.log('publish move');
        this.publishMove(msg.message.index, msg.message.piece);
      }

      else if(msg.message.reset){
        this.setState({
          squares: Array(9).fill(''),
          myTurn: false
        });
        this.turn = 'X';
        this.gameOver = false;
        this.counter = 0;
        Swal.close()
        // this.count = 0;
      }

      else if(msg.message.endGame){
        this.props.pubnub.unsubscribe({
          channels : [this.props.channel]
        });
        Swal.close()
        this.props.endGame();
      }
    });
  }

  newRound = (winner) => {
    console.log('starting new round')
    // Show this alert if the player is not the room creator
    console.log(this.props.isRoomCreator)
    console.log(this.gameOver)
    if((this.props.isRoomCreator === false) && this.gameOver){
      Swal.fire({  
        position: 'top',
        allowOutsideClick: false,
        title: `Player ${winner} won!`,
        text: 'Waiting for a new round...',
        confirmButtonColor: 'rgb(208,33,41)',
        width: 280,
        customClass: {
            heightAuto: false
        } ,
      });
      this.turn = 'X'; // Set turn to X so Player O can't make a move 
    } 

    // Show this alert to the room creator
    else if(this.props.isRoomCreator && this.gameOver){
      Swal.fire({      
        position: 'top',
        allowOutsideClick: false,
        title: `Player ${winner} won!`,
        text: 'Continue Playing?',
        showCancelButton: true,
        confirmButtonColor: 'rgb(208,33,41)',
        cancelButtonColor: '#aaa',
        cancelButtonText: 'Nope',
        confirmButtonText: 'Yea!',
        width: 280,
        customClass: {
            heightAuto: false
        } ,
      }).then((result) => {
        if (result.value) {
          this.props.pubnub.publish({
            message: {
              reset: true
            },
            channel: this.props.channel
          });
        }

        else{
          this.props.pubnub.publish({
            message: {
              endGame: true
            },
            channel: this.props.channel
          });
        }
      })      
    }
   }

  announceWinner = (winner) => {
    console.log('announcing winner')
    console.log(winner);
		let pieces = {
			'X': this.state.xScore,
			'O': this.state.oScore
		}
	
		// Update score for the winner
		if(winner === 'X'){
			pieces['X'] += 1;
			this.setState({
				xScore: pieces['X']
			});
		}
		else{
			pieces['O'] += 1;
			this.setState({
				oScore: pieces['O']
			});
		}
		// End the game once there is a winner
		this.gameOver = true;
		this.newRound(winner);	
  }
  
  checkForWinner = (squares) => {
    console.log('checking if there is a winner')
    const possibleCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
  
    for (let i = 0; i < possibleCombinations.length; i += 1) {
      const [a, b, c] = possibleCombinations[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        this.announceWinner(squares[a]);
        return;
      }
    }

    this.counter++;
    // Check if the game ends in a draw
    if(this.counter === 9){
      this.gameOver = true;
      this.newRound();
    }
  };
   
  publishMove = (index, piece) => {
    const squares = this.state.squares;

    squares[index] = piece;
    console.log('squares:' + squares[index]);
    this.turn = (squares[index] === 'X')? 'O' : 'X';
    this.setState({
      squares: squares,
      myTurn: !this.state.myTurn,
    });
    console.log('check for winner')
    this.checkForWinner(squares)
  }

  onMakeMove = (index) =>{
    const squares = this.state.squares;

    // Check if square is empty
    if(!squares[index] && (this.turn === this.props.piece)){
      const squares = this.state.squares;
  
      squares[index] = this.props.piece;
      console.log('squares:' + squares[index]);
      this.setState({
        squares: squares,
        myTurn: !this.state.myTurn,
      });
  
      this.turn = (this.turn === 'X') ? 'O' : 'X';

      this.props.pubnub.publish({
        message: {
          index: index,
          piece: this.props.piece,
          turn: this.turn
        },
        channel: this.props.channel
      });  

      console.log('check for winner')
      this.checkForWinner(squares)
    }
  }

  render() {
    let status;
    status = `Current player: ${this.state.myTurn ? 'O' : 'X'}`;

    // const gameStyle = {
    //   display: 'flex',
    //   flexDirection: 'column'
    // };

    // const board = {
    //   display: 'flex',
    //   flexDirection: 'row'
    // };

    // const playerInfo = {
    //   display: 'flex',
    //   flexDirection: 'row'
    // };

    return (
      <div className="game">
        <div className="board">
          <Board
              squares={this.state.squares}
              onClick={index => this.onMakeMove(index)}
            />  
            <p className="status-info">{status}</p>        
        </div>
        
        <div className="scores-container">
          <div>
            <p>{this.props.xUsername} (X): {this.state.xScore} </p>
          </div>

          <div>
            <p>{this.props.oUsername} (O): {this.state.oScore} </p>
          </div>

          {/* <div className="">
            <p> {this.state.oScore} </p>
            <p> {this.props.oUsername} (O) </p>
          </div> */}
        </div>   
      </div>
    );
  }
}

export default Game;
