import React from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import './index.css';

let socket = io('http://localhost:5000'); // connect to the socket on the server

// one square component
function Square(props) {
	return (
		<button className='square' onClick={props.onClick} disabled={props.disabled}>
			{props.value}	
		</button>
	);
}

// board component, array of 9 squares
class Board extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			squares: Array(9).fill(null),
			disableBoard: true,
			gameStarted: false,
			myTurn: true,
			symbol: '',
		};
	}
	
	handleClick(index) {
		if (this.state.myTurn) { // if not my turn, skip
			if (!this.state.squares[index]) { // if already filled, skip
				socket.emit('make.move', {
					symbol: this.state.symbol,
					index: index,
				});
			}
			else {
				return;
			}
		}
		else {
			return;
		}
	}
	
	renderSquare(index) {
		return (
			<Square
				value = {this.state.squares[index]}
				onClick = {() => this.handleClick(index)}
				disabled = {this.state.disableBoard}
			/>
		);
	}
	
	componentDidMount() { // after a render is completed
		
		socket.on('game.begin', (data) => { // begin game listener
			this.setState({
				gameStarted: true,
				symbol: data.symbol,
				myTurn: data.symbol === 'X', // x will start
			});
			if (this.state.myTurn) {
				this.setState({disableBoard: false}) // enable board for X for the first turn
			}
		});
		
		const squares = this.state.squares.slice() // immutable
		
		socket.on('move.made', (data) => { // move listener
			squares[data.index] = data.symbol;
			this.setState({
				myTurn: data.symbol !== this.state.symbol,
				squares: squares,
			});
			
			if (calculateWinner(this.state.squares)) { // if winner, disable both client boards
				this.setState({
					disableBoard: true,
				})
			}
			else {
				if (!this.state.myTurn) { // if not my turn, disable my board
					this.setState({disableBoard: true})
				}
				else { // enable the other players board
					this.setState({disableBoard: false})
				}
			}
		});
		
		socket.on('disconnect', () => { // disconnect
			this.setState({gameStarted: false});
		});
	}
	
	render() {
		const winner = calculateWinner(this.state.squares);
		let status;
		
		if (!this.state.gameStarted) { // game won't start until the opponent has joined
			status = 'Waiting for opponent to join'
		}
		else if (winner) {
			if (!this.state.myTurn) { // Disable the board if it is the opponents turn
				status = 'Game over. You won!';
			}
			else { // enable the board if it is your turn
				status = 'Game over. You lost.';
			}
		}
		else {
			if (!this.state.myTurn) { // Disable the board if it is the opponents turn
				status = 'Your opponents turn';
			}
			else { // enable the board if it is your turn
				status = 'Your turn';
			}
		}
				
		return (
			<div>
				<div className='status'>{status}</div>
				<div className="board-row">
					{this.renderSquare(0)}
					{this.renderSquare(1)}
					{this.renderSquare(2)}
				</div>
				<div className="board-row">
					{this.renderSquare(3)}
					{this.renderSquare(4)}
					{this.renderSquare(5)}
				</div>
				<div className="board-row">
					{this.renderSquare(6)}
					{this.renderSquare(7)}
					{this.renderSquare(8)}
				</div>
			</div>
		);
	}
}

class Game extends React.Component {
	render() {
		return (
			<div className="game">
				<div className="game-board">
				  <Board />
				</div>
		  </div>
		);
	} 
}

function calculateWinner(squares) {
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
	for (let i = 0; i < lines.length; i++) {
			const [a, b, c] = lines[i];
		if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
			return squares[a];
		}
	}
	return null;
}

ReactDOM.render(
	<Game />,
	document.getElementById('root')
);
