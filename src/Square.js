import React from 'react';
import './Game.css';

const Square = props => (
  
  
  <button className={`${props.winnerClass} square`} onClick={props.onClick}>
    {props.value}
  </button>
);

export default Square;
