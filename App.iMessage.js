//
// App.iMessage.js
//

import React, { Component } from 'react';
import {
  Text,
  View,
  NativeModules,
  NativeEventEmitter,
  TouchableOpacity,
  Button,
  Image,
  StyleSheet,
  ImagePropTypes,
  TextInput,
  InputAccessoryView, 
  ScrollView,
  Platform,
  PixelRatio,
  Switch
} from 'react-native';
import PropTypes from 'prop-types';
import {AutoGrowingTextInput} from 'react-native-autogrow-textinput';
import {KeyboardAccessoryView, KeyboardUtils} from 'react-native-keyboard-input';
import {KeyboardRegistry} from 'react-native-keyboard-input';
import {_} from 'lodash';



import DevMenu from './DevMenu';

import './demoKeyboards';
import CustomKeyboardView from './src/CustomKeyboardView';

const IsIOS = Platform.OS === 'ios';
const TrackInteractive = true;






// KeyboardRegistry.onItemSelected(`MyKeyboardView`, params);

const { MessagesManager, MessagesEventEmitter } = NativeModules;
const MessagesEvents = new NativeEventEmitter(MessagesEventEmitter);



export default class App extends Component {


  static propTypes = {
    title: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.keyboardAccessoryViewContent = this.keyboardAccessoryViewContent.bind(this);
    this.onKeyboardItemSelected = this.onKeyboardItemSelected.bind(this);
    this.resetKeyboardView = this.resetKeyboardView.bind(this);
    this.onKeyboardResigned = this.onKeyboardResigned.bind(this);
    this.showLastKeyboard = this.showLastKeyboard.bind(this);
    this.isCustomKeyboardOpen = this.isCustomKeyboardOpen.bind(this);


  }
  state ={
    presentationStyle: '',
    conversation: null,
    message: null,
     text: 'Placeholder Text',
     customKeyboard: {
      component: undefined,
      initialProps: undefined,
    },
    receivedKeyboardData: undefined,
    useSafeArea: true,
    keyboardOpenState: false,
}
  


  // static propTypes = {
  //   title: this.propTypes.string,
  // }
  onKeyboardItemSelected(keyboardId, params) {
    const receivedKeyboardData = `onItemSelected from "${keyboardId}"\nreceived params: ${JSON.stringify(params)}`;
    this.setState({receivedKeyboardData});
  }

  onKeyboardResigned() {
    this.setState({keyboardOpenState: false});
    this.resetKeyboardView();
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
        imageName: 'zebra.jpg',
        imageTitle: 'Image Title',
        imageSubtitle: 'Image Subtitle',
      },
      summaryText: 'Sent a message from AwesomeMessageExtension',
      url: `?timestamp=${Date.now()}&sender=${this.state.conversation.localParticipiantIdentifier}`
    })
    .then(() => MessagesManager.updatePresentationStyle('compact'))
    .catch(error => console.log('An error occurred while composing the message: ', error))
  }

  getToolbarButtons() {
    return [
      {
        text: 'show1',
        testID: 'show1',
        onPress: () => this.showKeyboardView('KeyboardView', 'FIRST - 1 (passed prop)'),
      },
      {
        text: 'show2',
        testID: 'show2',
        onPress: () => this.showKeyboardView('AnotherKeyboardView', 'SECOND - 2 (passed prop)'),
      },
      {
        text: 'reset',
        testID: 'reset',
        onPress: () => this.resetKeyboardView(),
      },
    ];
  }

  resetKeyboardView() {
    this.setState({customKeyboard: {}});
  }

  showKeyboardView(component, title) {
    this.setState({
      keyboardOpenState: true,
      customKeyboard: {
        component,
        initialProps: {title},
      },
    });
  }

  dismissKeyboard() {
    KeyboardUtils.dismiss();
  }

  showLastKeyboard() {
    const {customKeyboard} = this.state;
    this.setState({customKeyboard: {}});

    setTimeout(() => {
      this.setState({
        keyboardOpenState: true,
        customKeyboard,
      });
    }, 500);
  }
  isCustomKeyboardOpen = () => {
    const {keyboardOpenState, customKeyboard} = this.state;
    return keyboardOpenState && !_.isEmpty(customKeyboard);
  }

  toggleUseSafeArea = () => {
    const {useSafeArea} = this.state;
    this.setState({useSafeArea: !useSafeArea});

    if (this.isCustomKeyboardOpen()) {
      this.dismissKeyboard();
      this.showLastKeyboard();
    }
  }

  safeAreaSwitchToggle = () => {
    if (!IsIOS) {
      return (<View />);
    }
    const {useSafeArea} = this.state;
    return (
      <View style={styles.safeAreaSwitchContainer}>
        <Text>Safe Area Enabled:</Text>
        <Switch style={styles.switch} value={useSafeArea} onValueChange={this.toggleUseSafeArea}/>
      </View>
    );
  }

  keyboardAccessoryViewContent() {
    return (
      <View style={styles.keyboardContainer}>
        <View style={{borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#bbb'}}/>
        <View style={styles.inputContainer}>
          <AutoGrowingTextInput
            maxHeight={200}
            style={styles.textInput}
            ref={(r) => {
              this.textInputRef = r;
            }}
            placeholder={'Message'}
            underlineColorAndroid="transparent"
            onFocus={() => this.resetKeyboardView()}
            testID={'input'}
          />
          <TouchableOpacity style={styles.sendButton} onPress={() => KeyboardUtils.dismiss()}>
            <Text>Action</Text>
          </TouchableOpacity>
        </View>
        <View style={{flexDirection: 'row'}}>
          {
            this.getToolbarButtons().map((button, index) =>
              <TouchableOpacity
                onPress={button.onPress}
                style={{paddingLeft: 15, paddingBottom: 10}}
                key={index}
                testID={button.testID}
              >
                <Text>{button.text}</Text>
              </TouchableOpacity>)
          }
        </View>
      </View>
    );
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
    const inputAccessoryViewID = 'inputAccessoryView1';

    const COLOR = '#F5FCFF';
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: "green",
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
      scrollContainer: {
        justifyContent: 'center',
        padding: 15,
        flex: 1,
      },
      welcome: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
        paddingTop: 50,
        paddingBottom: 50,
      },
      inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
      },
      keyboardContainer: {
        ...Platform.select({
          ios: {
            flex: 1,
            backgroundColor: COLOR,
          },
        }),
      },
      textInput: {
        flex: 1,
        marginLeft: 10,
        marginTop: 10,
        marginBottom: 10,
        paddingLeft: 10,
        paddingTop: 2,
        paddingBottom: 5,
        fontSize: 16,
        backgroundColor: 'white',
        borderWidth: 0.5 / PixelRatio.get(),
        borderRadius: 18,
      },
      sendButton: {
        paddingRight: 15,
        paddingLeft: 15,
        alignSelf: 'center',
      },
      switch: {
        marginLeft: 15,
      },
      safeAreaSwitchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      },
    });

    return (
      <View style={styles.container}>
        {__DEV__ && <DevMenu />}

        
        <View style={{flexDirection: 'row'}}>
 
          {
            this.getToolbarButtons().map((button, index) =>
              <TouchableOpacity
                onPress={button.onPress}
                style={{paddingLeft: 15, paddingBottom: 10, borderRadius:5}}
                key={index}
                testID={button.testID}
              >
                <Text>{button.text}</Text>
              </TouchableOpacity>)
          }
          
        </View>
        <View>
        <TextInput
          style={styles.default}
          inputAccessoryViewID={inputAccessoryViewID}
          onChangeText={(text) => this.setState({ text })}
          value={this.state.text}
        />
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={{ backgroundColor: 'white' }}>
            <Button
              onPress={() =>
                this.setState({ text: 'Placeholder Text' })
              }
              title="Reset Text"
            />
          </View>
        </InputAccessoryView>
        </View>
{/* <KeyboardInput/> */}

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


