/*
 * @Author: shimingxia
 * @Date: 2022-08-15 09:07:10
 * @LastEditors: shimingxia
 * @LastEditTime: 2022-08-24 18:15:41
 * @Description: 
 */
import React from 'react';
import dva, {connect} from './dva/index'
import {Route, Link, Routes, routerRedux} from './dva/router'

const delay = (ms) => new Promise((resolve) =>{
  setTimeout(resolve, ms)
})

const app = dva()
// const app = dva({
//   history: createBrowserHistory()
// })
app.model({
  namespace: 'counter',
  state: {number: 0},
  reducers: {
    add(state) {
      return {number: state.number + 1}
    },
    minus(state) {
      return {number: state.number - 1}
    },
    asyncAdd(state) {
      console.log('reducers asyncAdd')
      return state
    }
  },
  effects: {
    *asyncAdd(action, {call, put}) {
      console.log('effects asyncAdd')
      yield call(delay, 1000)
      yield put({type: 'counter/add'})
    },
    *goto({payload}, {put}) {
      yield put(routerRedux.push(payload))
    }
  }
})
// const actionCreator = app.createActionCreators()
function Counter(props) {
  return (
    <div>
      <p>{props.number}</p>
      <button onClick={() => props.dispatch({type: 'counter/add'})}>+</button>
      <button onClick={() => props.dispatch({type: 'counter/minus'})}>-</button>
      <button onClick={() => props.dispatch({type: 'counter/asyncAdd'})}>asyncAdd</button>
      <button onClick={() => props.dispatch({type: 'counter/goto', payload: '/'})}>跳转到/</button>
    </div>
  )
}

const mapStateToProps = state => state.counter
const ConnectedCounter = connect(mapStateToProps)(Counter)

const Home = () => <div>Home</div>

app.router(() => (
  <div>
    <Link to='/'>Home</Link>
    <Link to='/counter'>Counter</Link>
    <Routes>
      <Route path='/' element={<Home />} / >
      <Route path='/counter' element={<ConnectedCounter />} />
    </Routes>
  </div>
));
app.start('#root')