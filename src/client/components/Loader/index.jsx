import React, { Component } from 'react'

export default class Loader extends Component {
  render() {
    return (
      <div className="lds-ring"><div></div><div></div><div></div><div></div></div>
    )
  }
}
