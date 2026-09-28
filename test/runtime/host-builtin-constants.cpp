#include "gea_runtime.h"
#include <cassert>
#include <type_traits>

struct Base {};
struct Derived : Base {};
template <> struct gea::detail::ClassRefBase<Derived> { using type = Base; };
static_assert(gea::detail::RefOperationsFor<Base>::classBase() == nullptr);
static_assert(gea::detail::RefOperationsFor<Derived>::classBase() == &gea::detail::RefOperationsFor<Base>::table);
static_assert(std::is_empty_v<decltype(gea::host::Math::floor)>);
static_assert(std::is_trivially_destructible_v<decltype(gea::host::Math::hypot)>);
constexpr auto floorFunction = gea::host::Math::floor;
#if defined(GEA_HOST_BUILTIN_PEER)
extern "C" const void* floorIdentityFromPeer();
#endif

int main() {
  auto& identities = gea::detail::allocationTypeProfile<gea::FunctionObjectIdentity>();
  const auto before = identities.created;
  assert(floorFunction.call(3.75) == 3.0);
  assert(gea::host::Math::floor(-3.25) == -4.0);
  assert(identities.created == before);

  gea::CallableObject<double(double)> first = gea::host::Math::floor.identified();
  gea::CallableObject<double(double)> second = gea::host::Math::floor.identified();
  assert(first == second);
  assert(first.functionObjectIdentity() == second.functionObjectIdentity());
  assert(identities.created == before + 1);
#if defined(GEA_HOST_BUILTIN_PEER)
  assert(floorIdentityFromPeer() == first.functionObjectIdentity().get());
#endif
  assert(first.call(4.5) == 4.0);
  auto boxA = gea::Value::box(gea::Value::Tag::Function, first);
  auto boxB = gea::Value::box(gea::Value::Tag::Function, second);
  const auto key = gea::PropertyKey::string("probe");
  boxA.setProperty(key, gea::Value::box(gea::Value::Tag::Number, 7.0));
  assert(boxB.getProperty(key).as<double>() == 7.0);

  auto characters = gea::arrayOf<double>({65, 66});
  assert(gea::host::StringConstructor::fromCharCode.call(characters) == "AB");
  auto nowA = gea::host::DateConstructor::now.identified();
  auto nowB = gea::host::DateConstructor::now.identified();
  assert(nowA == nowB);
  assert(nowA.call() > 0);
}
