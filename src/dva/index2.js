/*
 * @Author: shimingxia
 * @Date: 2022-08-24 10:51:49
 * @LastEditors: shimingxia
 * @LastEditTime: 2022-08-24 18:17:51
 * @Description: 
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import {Provider, connect} from 'react-redux';
import createSagaMiddleware from 'redux-saga'
import * as sagaEffects from 'redux-saga/effects';
import {createHashHistory} from 'history'
import {routerMiddleware, connectRouter} from 'connected-react-router'
export { connect }

function dva(opts) {
  const app = {
    _modules: [],
    model,
    _router: null,
    router,
    start,
    history: createHashHistory()
  }
  if(opts.history) {
    console.log(33333)
    app.history = opts.history
  }
  function model(modelCobfig) {
    const prefixModel = prefixNamespace(modelCobfig)
    app._modules.push(prefixModel)
  }

  function router(routerConfig) {
    app._router = routerConfig
  }
  function start(root) {
    let reducers = { router: connectRouter(app.history) }
    for(const model of app._modules) {
      reducers[model.namespace] = getReducer(model)
    }
    let combinedRedeucer = combineReducers(reducers)
    const sagas = getSagas(app)
    let sagaMiddleware = createSagaMiddleware()
    let store = applyMiddleware(sagaMiddleware, routerMiddleware(app.history))(createStore)(combinedRedeucer)
    sagas.forEach(saga => {
      sagaMiddleware.run(saga)
    });
    // let store = createStore(combinedRedeucer)
    ReactDOM.render(
      <Provider store={store}>
        {app._router({history: app.history})}
      </Provider>, document.querySelector(root)
    )
  }
  function getSagas(app) {
    let sagas = []
    for(const model of app._modules){
      let saga = getSaga(model)
      sagas.push(saga)
    }
    return sagas
  }
  return app
}

function getSaga(model) {
  const { effects } = model
  return function* () {
    for(const key in effects) {
      yield sagaEffects.takeEvery(key, function*(action) {
        yield effects[key](action, {
          ...sagaEffects, put: action => sagaEffects.put(
            {...action, type: prefixType(action.type, model.namespace)}
          )
        })
      })
    }
  }
}

function prefixType(type, namespace) {
  if(type.indexOf('/') === -1) {
    return namespace + '/' + type
  } else if(type.split('/')[0] === namespace) {
    console.warn(`Warning: [sagaEffects.put] ${type} should not be prefised with namespace ${namespace}`)
  }
  return type
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

function prefix(obj, namespace) {
  let newObj = {}
  for(let key in obj) {
    newObj[namespace + '/' + key] = obj[key]
  }
  return newObj
}

function prefixNamespace(model) {
  if(model.reducers) {
    model.reducers = prefix(model.reducers, model.namespace)
  } if(model.effects) {
    model.effects = prefix(model.effects, model.namespace)
  }
  return model
}

export default dva
