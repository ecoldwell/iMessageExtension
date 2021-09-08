//
// App.iMessage.js
//

import React, { Component } from 'react';
import {
  Text,
  View,
  NativeModules,
  NativeEventEmitter,
  Button,
  Image,
  StyleSheet,
} from 'react-native';
import DevMenu from './DevMenu';

const { MessagesManager, MessagesEventEmitter } = NativeModules;
const MessagesEvents = new NativeEventEmitter(MessagesEventEmitter);

export default class App extends Component {
  state = {
    presentationStyle: '',
    conversation: null,
    message: null,
  }

  componentDidMount() {
    MessagesManager
      .getPresentationStyle(presentationStyle => this.setState({ presentationStyle }))

    MessagesEvents
      .addListener('onPresentationStyleChanged', ({ presentationStyle }) => this.setState({ presentationStyle }));

    MessagesManager
      .getActiveConversation((conversation, message) => this.setState({ conversation, message }));

    MessagesEvents
      .addListener('didReceiveMessage', ({ message }) => this.setState({ message }));

    MessagesEvents
      .addListener('didSelectMessage', ({ message }) => this.setState({ message }));

    this.performFakeAsyncTaskAndHideLoadingView()
  }

  performFakeAsyncTaskAndHideLoadingView = () => {
    setTimeout(() => MessagesManager.hideLoadingView(), 1500);
  }

  onTogglePresentationStyle = () => {
    MessagesManager
      .updatePresentationStyle(this.state.presentationStyle === 'expanded' ? 'compact' : 'expanded')
      .then(presentationStyle => this.setState({ presentationStyle }))
  }

  onComposeMessage = () => {
    MessagesManager.composeMessage({
      layout: {
        imageName: '000.jpg',
        imageTitle: 'Image Title',
        imageSubtitle: 'Image Subtitle',
      },
      summaryText: 'Sent a message from AwesomeMessageExtension',
      url: `?timestamp=${Date.now()}&sender=${this.state.conversation.localParticipiantIdentifier}`
    })
    .then(() => MessagesManager.updatePresentationStyle('compact'))
    .catch(error => console.log('An error occurred while composing the message: ', error))
  }

  onOpenURL = () => {
    MessagesManager.openURL('url://test')
      .then(() => console.log('Successfully opened url!'))
      .catch(error => console.log('An error occurred while opening the URL: ', error))
  }

  onShowLoadingView = () => {
    MessagesManager.showLoadingView();
    this.performFakeAsyncTaskAndHideLoadingView();
  }
  

  render() {
    const { message } = this.state;

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: "red",
        padding: 20,
      },
      textInputView: {
        padding: 8,
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
      },
      textInput: {
        flexGrow: 1,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: "#CCC",
        padding: 10,
        fontSize: 16,
        marginRight: 10,
        textAlignVertical: "top",
      },
      textInputButton: {
        flexShrink: 1,
      },
    });

    return (
      <View style={styles.container}>
        {__DEV__ && <DevMenu />}
        <Text>TESTING CUSTOM</Text>
        <Image source={{uri: 'https://reactjs.org/logo-og.png'}}
       style={{width: 40, height: 40}} />

        <Button
          title="Toggle the Presentation Style"
          onPress={this.onTogglePresentationStyle}
          disabled={!this.state.presentationStyle}
        />

        <Button
          title="Compose Message"
          onPress={this.onComposeMessage}
        />

        <Button
          title="Open URL"
          onPress={this.onOpenURL}
        />

        <Button
          title="Show Loading View (hides after 3 seconds)"
          onPress={this.onShowLoadingView}
        />

        {message && message.url && (
          <View style={{
            marginTop: 25,
            alignItems: 'center',
          }}>
            <Text>
              URL from the message:
            </Text>

            <Text style={{
              fontWeight: 'bold',
              paddingLeft: 24,
              paddingRight: 24,
            }}>
              {message.url}
            </Text>
          </View>
        )}
      </View>
    );
  }
}


