import React from 'react';
import Board from './Board';


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
    // this.game_over = false;
  }

  componentWillMount(){
    this.props.pubnub.getMessage(this.props.channel, (msg) => {
      if(msg.message.turn === this.props.piece){
        console.log('publish move');
        this.publishMove(msg.message.index, msg.message.piece);
      }

      else if(msg.message.reset || msg.message.gameOver){
        this.setState({
          squares: Array(9).fill(''),
          myTurn: false
        });

        this.turn = 'X';
        this.setState({isDisabled: false});
      }
    });
  }

  calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
  
    for (let i = 0; i < lines.length; i += 1) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], winnerRow: lines[i] };
      }
    }
  
    return { winner: null, winnerRow: null };
  };
  
  getLocation = (move) => {
    const locationMap = {
      0: {row: 0, col: 0},
      1: {row: 0, col: 1},
      2: {row: 0, col: 2},
      3: {row: 1, col: 0},
      4: {row: 1, col: 1},
      5: {row: 1, col: 2},
      6: {row: 2, col: 0},
      7: {row: 2, col: 1},
      8: {row: 2, col: 2},
    };
  
    return locationMap[move];
  };
  
  publishMove = (index, piece) => {
    const squares = this.state.squares;

    if (this.calculateWinner(squares).winner || squares[index]) {
      return;
    }
    squares[index] = piece;
    console.log('squares:' + squares[index]);
    this.turn = (squares[index] === 'X')? 'O' : 'X';
    this.setState({
      squares: squares,
      myTurn: !this.state.myTurn,
    });
  }

  onMakeMove = (index) =>{
    const squares = this.state.squares;

    // Check if square is empty
    if(!squares[index] && (this.turn === this.props.piece)){
      const squares = this.state.squares;
  
      // if (this.calculateWinner(squares).winner || squares[index]) {
      //   return;
      // }
      squares[index] = this.props.piece;
      console.log('squares:' + squares[index]);
      this.setState({
        squares: squares,
        myTurn: !this.state.myTurn,
      });
  
      // let temp = this.getLocation(i);
      // let row = temp.row;
      // let col = temp.col;  
      this.turn = (this.turn === 'X') ? 'O' : 'X';

      this.props.pubnub.publish({
        message: {
          index: index,
          piece: this.props.piece,
          turn: this.turn
        },
        channel: this.props.channel
      });       
    }
  }

  render() {
    const { winner, winnerRow } = this.calculateWinner(this.state.squares);

    let status;
    if (winner) {
      status = `Winner ${winner}`;
    } 
    else {
      status = `Current player: ${this.state.myTurn ? 'O' : 'X'}`;
    }

    const gameStyle = {
      display: 'flex',
      flexDirection: 'column'
    };

    const board = {
      display: 'flex',
      flexDirection: 'row'
    };

    const playerInfo = {
      display: 'flex',
      flexDirection: 'row'
    };

    return (
      <div style={gameStyle}>
        <div style={board}>
          <Board
              squares={this.state.squares}
              winnerSquares={winnerRow}
              onClick={index => this.onMakeMove(index)}
            />  
            <p>{status}</p>        
        </div>
        
        <div style={playerInfo}>
          <div className="">
            <p> {this.state.xScore} </p>
            <p> {this.props.xUsername} (X) </p>
          </div>

          <div className="">
            <p> {this.state.oScore} </p>
            <p> {this.props.oUsername} (O) </p>
          </div>
        </div>   
      </div>
    );
  }
}

export default Game;
