class KeyboardView extends Component {
    static propTypes = {
      title: PropTypes.string,
    };
    render() {
      return (
        <ScrollView contentContainerStyle={[styles.keyboardContainer, {backgroundColor: 'purple'}]}>
          <Text style={{color: 'white'}}>HELOOOO!!!</Text>
          <Text style={{color: 'white'}}>{this.props.title}</Text>
        </ScrollView>
      );
    }
  }