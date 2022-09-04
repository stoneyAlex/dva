import React from 'react';
import ReactDOM from 'react-dom';
import {Provider, connect} from 'react-redux'
import { combineReducers, createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga'
import * as sagaEffects from 'redux-saga/effects';
import prefixNamespace from './prefixNamespace'
import {createBrowserHistory} from 'history'
import {HistoryRouter} from 'redux-first-history/rr6'
import {createReduxHistoryContext} from 'redux-first-history'
const {
  routerReducer,
  routerMiddleware,
  createReduxHistory
} = createReduxHistoryContext({history: createBrowserHistory()})
const {takeEvery} = sagaEffects
export { connect }

function dva() {
  const app = {
    _models: [],
    model,
    router,
    _router: null,
    start,
    // createActionCreators
  }
  const initialReducers = {router: routerReducer}
  function model(model) {
    const prefixedModel = prefixNamespace(model)
    app._models.push(prefixedModel)
    return prefixedModel
  }
  function router(router) {
    app._router = router
  }

  // function createActionCreators() {
  //   const actionCreators = {}
  //   for (const model of app._models) {
  //     const {reducers} = model
  //     for (let type in reducers) {
  //       actionCreators[type] = () => ({type})
  //     }
  //   }
  //   return actionCreators
  // }
  function start(selector) {
    for(const model of app._models) {
      initialReducers[model.namespace] = getReducer(model)
    }
    const rootReducer = createReducer()
    const sagas = getSagas(app)
    let sagaMiddleware = createSagaMiddleware()
    let store = applyMiddleware(routerMiddleware, sagaMiddleware)(createStore)(rootReducer)
    sagas.forEach(saga => {
      sagaMiddleware.run(saga)
    });
    const history = createReduxHistory(store)
    ReactDOM.render(
      <Provider store={store}>
        <HistoryRouter history={history}>
          {app._router()}
        </HistoryRouter>
      </Provider>, document.querySelector(selector)
    )
  }
  function createReducer() {
    return combineReducers(initialReducers)
  }
  return app;
}

function getSagas(app) {
  let sagas = []
  for(const model of app._models){
    let saga = getSaga(model)
    sagas.push(saga)
  }
  return sagas
}

function getSaga(model) {
  const { effects } = model
  return function* () {
    for(const key in effects) {
      yield takeEvery(key, function*(action) {
        yield effects[key](action, sagaEffects)
      })
    }
  }
}

function getReducer(model) {
  const {state: initialState, reducers} = model
  let reducer = (state = initialState, action) => {
    let reducer = reducers[action.type]
    if(reducer) {
      return reducer(state, action)
    }
    return state
  }
  return reducer
}

export default dva